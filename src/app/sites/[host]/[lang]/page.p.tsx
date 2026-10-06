import { HostPage, hostMetadata } from "@/platform/page-helpers";

type Props = { params: Promise<{ host: string; lang: string }> };

export const revalidate = 300;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props) {
  const { host, lang } = await params;
  return hostMetadata(host, lang);
}

/** Other languages, e.g. /en/. */
export default async function Page({ params }: Props) {
  const { host, lang } = await params;
  return <HostPage host={host} lang={lang} />;
}
