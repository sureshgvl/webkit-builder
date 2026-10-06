import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { HttpError } from "./db";

export type StoredImage = { ref: string; url: string; size: number };

const MAX_UPLOAD = 10 * 1024 * 1024;

/** Client photos in Cloudflare R2 under sites/<slug>/images/. Uploads are resized and converted to WebP. */
export class ImageStore {
  private s3: S3Client;

  constructor(
    private bucket: string,
    endpoint: string,
    accessKeyId: string,
    secretAccessKey: string,
    private publicBase: string,
  ) {
    this.s3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
      // R2 compatibility: only send/validate checksums when the operation requires them.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }

  private url(key: string) {
    return `${this.publicBase.replace(/\/$/, "")}/${key}`;
  }

  async list(slug: string): Promise<StoredImage[]> {
    const prefix = `sites/${slug}/images/`;
    const out = await this.s3.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, MaxKeys: 500 }));
    return (out.Contents ?? [])
      .filter((o) => o.Key)
      .map((o) => ({ ref: o.Key!.slice(`sites/${slug}/`.length), url: this.url(o.Key!), size: o.Size ?? 0 }))
      .sort((a, b) => a.ref.localeCompare(b.ref));
  }

  /**
   * Any photo (JPEG/PNG/WebP/HEIC that sharp can read) → WebP, longest side ≤ 1600 px (logos ≤ 512 px).
   * Transparency is kept (cut-out vehicle photos, logos).
   */
  async upload(slug: string, filename: string, body: Buffer, kind: "photo" | "logo" = "photo"): Promise<StoredImage> {
    if (!body.length) throw new HttpError(400, "Empty file");
    if (body.length > MAX_UPLOAD) throw new HttpError(413, "Photo is larger than 10 MB");
    const base =
      filename
        .toLowerCase()
        .replace(/\.[a-z0-9]+$/, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "photo";
    const max = kind === "logo" ? 512 : 1600;
    let webp: Buffer;
    try {
      webp = await sharp(body, { failOn: "error" })
        .rotate() // respect phone camera orientation
        .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82, alphaQuality: 90 })
        .toBuffer();
    } catch {
      throw new HttpError(415, "This file is not a supported image (use JPG, PNG or WebP)");
    }
    const ref = `images/${kind === "logo" ? "logo" : base}.webp`;
    const key = `sites/${slug}/${ref}`;
    await this.s3.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: webp, ContentType: "image/webp", CacheControl: "public, max-age=86400" }),
    );
    return { ref, url: `${this.url(key)}?v=${Date.now()}`, size: webp.length };
  }

  async remove(slug: string, ref: string) {
    if (!/^images\/[a-z0-9/_.-]+$/.test(ref) || ref.includes("..")) throw new HttpError(400, "Bad image name");
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: `sites/${slug}/${ref}` }));
  }
}
