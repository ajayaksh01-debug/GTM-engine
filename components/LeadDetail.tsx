"use client";

import { useEffect, useState } from "react";
import type { Interaction, Lead } from "@/lib/airtable";
import { CHANNELS, GEOGRAPHIES, PRODUCTS, STAGES } from "@/lib/airtable";

export default function LeadDetail({ id }: { id: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [interactions, setInteractions] = useState<Interaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then(async (res) => {
        const data = (await res.json()) as { lead?: Lead; error?: string };
        if (!res.ok || !data.lead) throw new Error(data.error ?? "Failed to load lead");
        setLead(data.lead);
      })
      .catch((err) => setError(err.message));

    fetch(`/api/leads/${id}/interactions`)
      .then(async (res) => {
        const data = (await res.json()) as { interactions?: Interaction[] };
        if (res.ok && data.interactions) setInteractions(data.interactions);
      })
      .catch(() => {});
  }, [id]);

  async function save(patch: Partial<Lead>) {
    if (!lead) return;
    setSaving(true);
    const next = { ...lead, ...patch };
    setLead(next);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!lead) return <p className="text-sm text-gray-500">Loading…</p>;

  async function syncGmail() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch(`/api/leads/${id}/sync-gmail`, { method: "POST" });
      const data = (await res.json()) as { added?: number; total?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setSyncMessage(`Synced ${data.added} new message(s) of ${data.total} found.`);
      const refreshed = (await fetch(`/api/leads/${id}/interactions`).then((r) =>
        r.json()
      )) as { interactions?: Interaction[] };
      setInteractions(refreshed.interactions ?? []);
    } catch (err) {
      setSyncMessage((err as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Details {saving && <span className="text-gray-400">saving…</span>}
        </h2>
        <TextField label="Name" value={lead.name} onSave={(v) => save({ name: v })} />
        <TextField label="Company" value={lead.company} onSave={(v) => save({ company: v })} />
        <TextField label="Email" value={lead.email} onSave={(v) => save({ email: v })} />
        <SelectField
          label="Product"
          value={lead.product ?? ""}
          options={PRODUCTS}
          onSave={(v) => save({ product: v as Lead["product"] })}
        />
        <SelectField
          label="Channel"
          value={lead.channel ?? ""}
          options={CHANNELS}
          onSave={(v) => save({ channel: v as Lead["channel"] })}
        />
        <SelectField
          label="Geography"
          value={lead.geography ?? ""}
          options={GEOGRAPHIES}
          onSave={(v) => save({ geography: v as Lead["geography"] })}
        />
        <SelectField
          label="Stage"
          value={lead.stage ?? ""}
          options={STAGES}
          onSave={(v) => save({ stage: v as Lead["stage"] })}
        />
        <TextField
          label="Next Follow-up"
          type="date"
          value={lead.nextFollowUp ?? ""}
          onSave={(v) => save({ nextFollowUp: v })}
        />
        <TextAreaField label="Notes" value={lead.notes} onSave={(v) => save({ notes: v })} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Conversation History
          </h2>
          <button
            onClick={syncGmail}
            disabled={syncing || !lead.email}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Sync Gmail"}
          </button>
        </div>
        {syncMessage && <p className="mb-3 text-xs text-gray-500">{syncMessage}</p>}
        {!lead.email && (
          <p className="mb-3 text-sm text-gray-500">
            Add an email address to enable Gmail sync.
          </p>
        )}
        {interactions === null ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : interactions.length === 0 ? (
          <p className="text-sm text-gray-500">
            No conversation history yet. Click &quot;Sync Gmail&quot; to pull
            it in (requires connecting Gmail from the dashboard first).
          </p>
        ) : (
          <ul className="space-y-3">
            {interactions.map((i) => (
              <li key={i.id} className="rounded-md border border-gray-200 p-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{i.direction}</span>
                  <span>{i.date}</span>
                </div>
                <p className="mt-1 font-medium text-gray-900">{i.subject}</p>
                <p className="mt-1 text-sm text-gray-600">{i.snippet}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TextField({
  label,
  value,
  onSave,
  type = "text",
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  type?: string;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => local !== value && onSave(local)}
        className="input"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => local !== value && onSave(local)}
        className="input"
        rows={4}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onSave,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onSave: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <select value={value} onChange={(e) => onSave(e.target.value)} className="input">
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
