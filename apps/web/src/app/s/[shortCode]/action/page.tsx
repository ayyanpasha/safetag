import { ActionCards } from "@/components/scanner/action-cards";

interface Props {
  params: Promise<{ shortCode: string }>;
}

export default async function ActionPage({ params }: Props) {
  const { shortCode } = await params;
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <ActionCards shortCode={shortCode} />
    </div>
  );
}
