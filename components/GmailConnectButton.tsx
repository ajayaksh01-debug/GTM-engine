"use client";

import { useEffect, useState } from "react";

export default function GmailConnectButton() {
  const [connected, setConnected] = useState<boolean | null>(null);

  function refresh() {
    fetch("/api/auth/status")
      .then((res) => res.json() as Promise<{ connected?: boolean }>)
      .then((data) => setConnected(Boolean(data.connected)))
      .catch(() => setConnected(false));
  }

  useEffect(refresh, []);

  async function disconnect() {
    await fetch("/api/auth/disconnect", { method: "POST" });
    refresh();
  }

  if (connected === null) return null;

  if (connected) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="flex items-center gap-1.5 text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Gmail connected
        </span>
        <button
          onClick={disconnect}
          className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
        >
          disconnect
        </button>
      </div>
    );
  }

  return (
    <a
      href="/api/auth/google"
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      Connect Gmail
    </a>
  );
}
