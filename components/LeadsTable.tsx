"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Lead } from "@/lib/airtable";
import { CHANNELS, GEOGRAPHIES, PRODUCTS, STAGES } from "@/lib/airtable";

const STAGE_COLORS: Record<string, string> = {
  New: "bg-gray-100 text-gray-700",
  Contacted: "bg-blue-100 text-blue-700",
  Replied: "bg-cyan-100 text-cyan-700",
  "Meeting Booked": "bg-purple-100 text-purple-700",
  "Proposal Sent": "bg-amber-100 text-amber-700",
  Negotiation: "bg-orange-100 text-orange-700",
  Won: "bg-green-100 text-green-700",
  Lost: "bg-red-100 text-red-700",
};

export default function LeadsTable() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState("");
  const [channel, setChannel] = useState("");
  const [geography, setGeography] = useState("");
  const [stage, setStage] = useState("");

  useEffect(() => {
    fetch("/api/leads")
      .then(async (res) => {
        const data = (await res.json()) as { leads?: Lead[]; error?: string };
        if (!res.ok || !data.leads) throw new Error(data.error ?? "Failed to load leads");
        setLeads(data.leads);
      })
      .catch((err) => setError(err.message));
  }, []);

  const filtered = useMemo(() => {
    if (!leads) return [];
    return leads.filter((l) => {
      if (product && l.product !== product) return false;
      if (channel && l.channel !== channel) return false;
      if (geography && l.geography !== geography) return false;
      if (stage && l.stage !== stage) return false;
      return true;
    });
  }, [leads, product, channel, geography, stage]);

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={product} onChange={setProduct} label="Product" options={PRODUCTS} />
        <Select value={channel} onChange={setChannel} label="Channel" options={CHANNELS} />
        <Select value={geography} onChange={setGeography} label="Geography" options={GEOGRAPHIES} />
        <Select value={stage} onChange={setStage} label="Stage" options={STAGES} />
      </div>

      {leads === null ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No leads match these filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>Name</Th>
                <Th>Company</Th>
                <Th>Product</Th>
                <Th>Channel</Th>
                <Th>Geography</Th>
                <Th>Stage</Th>
                <Th>Last Contact</Th>
                <Th>Next Follow-up</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {lead.name || "—"}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{lead.company || "—"}</td>
                  <td className="px-3 py-2 text-gray-600">{lead.product || "—"}</td>
                  <td className="px-3 py-2 text-gray-600">{lead.channel || "—"}</td>
                  <td className="px-3 py-2 text-gray-600">{lead.geography || "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STAGE_COLORS[lead.stage ?? ""] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {lead.stage || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{lead.lastContactDate || "—"}</td>
                  <td className="px-3 py-2 text-gray-600">{lead.nextFollowUp || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}

function Select({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: readonly string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700"
    >
      <option value="">{label}: All</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
