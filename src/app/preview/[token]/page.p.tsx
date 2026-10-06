import { PreviewPage, previewMetadata } from "@/platform/preview";

export const dynamic = "force-dynamic";
export const metadata = previewMetadata;

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  return <PreviewPage token={(await params).token} />;
}
