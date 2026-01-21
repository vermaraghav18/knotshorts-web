// app/admin/insta/[id]/page.tsx
import InstaDownloadClient from "./ui";

export default async function InstaPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InstaDownloadClient id={id} />;
}
