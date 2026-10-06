import { HostPage, hostMetadata } from "@/platform/page-helpers";

type Props = { params: Promise<{ host: string }> };

export const revalidate = 300; // same as SITE_REVALIDATE_SECONDS (Next needs a literal here)
export const dynamicParams = true;
export function generateStaticParams() {
  return []; // pages are built on first visit, then cached
}

export async function generateMetadata({ params }: Props) {
  return hostMetadata((await params).host);
}

/** Default language of the site for this web address. */
export default async function Page({ params }: Props) {
  return <HostPage host={(await params).host} />;
}
