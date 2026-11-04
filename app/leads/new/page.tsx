"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { CHANNELS, GEOGRAPHIES, PRODUCTS, STAGES } from "@/lib/airtable";

export default function NewLeadPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    product: "",
    channel: "",
    geography: "",
    stage: "New",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create lead");
      router.push(`/leads/${data.lead.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-6 py-4">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">New Lead</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Company">
            <input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Product">
              <select
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
                className="input"
              >
                <option value="">Select…</option>
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Channel">
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                className="input"
              >
                <option value="">Select…</option>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Geography">
              <select
                value={form.geography}
                onChange={(e) => setForm({ ...form, geography: e.target.value })}
                className="input"
              >
                <option value="">Select…</option>
                {GEOGRAPHIES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Stage">
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="input"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input"
              rows={4}
            />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save Lead"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
