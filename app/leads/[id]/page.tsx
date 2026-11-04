import Link from "next/link";
import LeadDetail from "@/components/LeadDetail";

export default async function LeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Lead Detail</h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <LeadDetail id={id} />
      </main>
    </div>
  );
}
