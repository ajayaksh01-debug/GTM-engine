import Link from "next/link";
import LeadsTable from "@/components/LeadsTable";
import GmailConnectButton from "@/components/GmailConnectButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-900">GTM Engine</h1>
          <div className="flex items-center gap-3">
            <GmailConnectButton />
            <Link
              href="/leads/new"
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
            >
              + Add Lead
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <LeadsTable />
      </main>
    </div>
  );
}
