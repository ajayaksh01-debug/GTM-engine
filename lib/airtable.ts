import Airtable, { FieldSet } from "airtable";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app3pIXQ08Ubx7s0f";

function getBase() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!apiKey) {
    throw new Error("AIRTABLE_API_KEY is not set");
  }
  return new Airtable({ apiKey }).base(BASE_ID);
}

export const PRODUCTS = ["Ethana AI", "Cursory"] as const;
export const CHANNELS = [
  "Direct",
  "Partnership",
  "Advisory",
  "Direct to Brand",
  "Direct to Agency",
  "Agency for Brands",
  "Tenders",
] as const;
export const GEOGRAPHIES = ["India", "UK/Europe", "US"] as const;
export const STAGES = [
  "New",
  "Contacted",
  "Replied",
  "Meeting Booked",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
] as const;

export type Product = (typeof PRODUCTS)[number];
export type Channel = (typeof CHANNELS)[number];
export type Geography = (typeof GEOGRAPHIES)[number];
export type Stage = (typeof STAGES)[number];

export type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  product: Product | null;
  channel: Channel | null;
  geography: Geography | null;
  stage: Stage | null;
  lastContactDate: string | null;
  nextFollowUp: string | null;
  gmailThreadId: string | null;
  notes: string;
};

export type Interaction = {
  id: string;
  leadId: string | null;
  subject: string;
  date: string | null;
  direction: "Sent" | "Received" | null;
  snippet: string;
  gmailMessageId: string | null;
};

function recordToLead(record: Airtable.Record<Airtable.FieldSet>): Lead {
  const f = record.fields;
  return {
    id: record.id,
    name: (f["Name"] as string) ?? "",
    company: (f["Company"] as string) ?? "",
    email: (f["Email"] as string) ?? "",
    product: (f["Product"] as Product) ?? null,
    channel: (f["Channel"] as Channel) ?? null,
    geography: (f["Geography"] as Geography) ?? null,
    stage: (f["Stage"] as Stage) ?? null,
    lastContactDate: (f["Last Contact Date"] as string) ?? null,
    nextFollowUp: (f["Next Follow-up"] as string) ?? null,
    gmailThreadId: (f["Gmail Thread ID"] as string) ?? null,
    notes: (f["Notes"] as string) ?? "",
  };
}

function recordToInteraction(
  record: Airtable.Record<Airtable.FieldSet>
): Interaction {
  const f = record.fields;
  const leadLinks = f["Lead"] as string[] | undefined;
  return {
    id: record.id,
    leadId: leadLinks?.[0] ?? null,
    subject: (f["Subject"] as string) ?? "",
    date: (f["Date"] as string) ?? null,
    direction: (f["Direction"] as Interaction["direction"]) ?? null,
    snippet: (f["Snippet"] as string) ?? "",
    gmailMessageId: (f["Gmail Message ID"] as string) ?? null,
  };
}

export async function listLeads(): Promise<Lead[]> {
  const base = getBase();
  const records = await base("Leads")
    .select({ sort: [{ field: "Last Contact Date", direction: "desc" }] })
    .all();
  return records.map(recordToLead);
}

export async function getLead(id: string): Promise<Lead> {
  const base = getBase();
  const record = await base("Leads").find(id);
  return recordToLead(record);
}

function leadInputToFields(input: Partial<Omit<Lead, "id">>): Partial<FieldSet> {
  const fields: Partial<FieldSet> = {};
  if (input.name !== undefined) fields["Name"] = input.name ?? undefined;
  if (input.company !== undefined) fields["Company"] = input.company ?? undefined;
  if (input.email !== undefined) fields["Email"] = input.email ?? undefined;
  if (input.product !== undefined) fields["Product"] = input.product ?? undefined;
  if (input.channel !== undefined) fields["Channel"] = input.channel ?? undefined;
  if (input.geography !== undefined) fields["Geography"] = input.geography ?? undefined;
  if (input.stage !== undefined) fields["Stage"] = input.stage ?? undefined;
  if (input.lastContactDate !== undefined)
    fields["Last Contact Date"] = input.lastContactDate ?? undefined;
  if (input.nextFollowUp !== undefined)
    fields["Next Follow-up"] = input.nextFollowUp ?? undefined;
  if (input.gmailThreadId !== undefined)
    fields["Gmail Thread ID"] = input.gmailThreadId ?? undefined;
  if (input.notes !== undefined) fields["Notes"] = input.notes ?? undefined;
  return fields;
}

export async function createLead(
  input: Partial<Omit<Lead, "id">>
): Promise<Lead> {
  const base = getBase();
  const created = await base("Leads").create(leadInputToFields(input));
  return recordToLead(created);
}

export async function updateLead(
  id: string,
  input: Partial<Omit<Lead, "id">>
): Promise<Lead> {
  const base = getBase();
  const updated = await base("Leads").update(id, leadInputToFields(input));
  return recordToLead(updated);
}

export async function listInteractions(leadId: string): Promise<Interaction[]> {
  const base = getBase();
  const records = await base("Interactions")
    .select({
      filterByFormula: `FIND("${leadId}", ARRAYJOIN({Lead}))`,
      sort: [{ field: "Date", direction: "desc" }],
    })
    .all();
  return records.map(recordToInteraction);
}

export async function addInteraction(input: {
  leadId: string;
  subject: string;
  date: string;
  direction: "Sent" | "Received";
  snippet: string;
  gmailMessageId?: string;
}): Promise<Interaction> {
  const base = getBase();
  const created = await base("Interactions").create({
    Lead: [input.leadId],
    Subject: input.subject,
    Date: input.date,
    Direction: input.direction,
    Snippet: input.snippet,
    "Gmail Message ID": input.gmailMessageId ?? "",
  });
  return recordToInteraction(created);
}
