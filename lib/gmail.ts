import { getValidAccessToken } from "@/lib/google-oauth";

type GmailMessage = {
  id: string;
  threadId: string;
  subject: string;
  date: string; // ISO date
  direction: "Sent" | "Received";
  snippet: string;
};

function headerValue(
  headers: { name: string; value: string }[] | undefined,
  name: string
): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

async function gmailFetch(path: string, accessToken: string) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail API error (${res.status}): ${text}`);
  }
  return res.json();
}

export async function findThreadsForEmail(
  email: string,
  maxResults = 20
): Promise<GmailMessage[]> {
  const accessToken = await getValidAccessToken();

  const profile = (await gmailFetch("/profile", accessToken)) as {
    emailAddress: string;
  };
  const selfEmail = profile.emailAddress.toLowerCase();

  const query = `(from:${email} OR to:${email})`;
  const list = (await gmailFetch(
    `/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
    accessToken
  )) as { messages?: { id: string; threadId: string }[] };

  if (!list.messages?.length) return [];

  const messages = await Promise.all(
    list.messages.map(async (m) => {
      const detail = (await gmailFetch(
        `/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        accessToken
      )) as {
        id: string;
        threadId: string;
        snippet: string;
        payload: { headers: { name: string; value: string }[] };
      };

      const from = headerValue(detail.payload.headers, "From").toLowerCase();
      const direction: GmailMessage["direction"] = from.includes(selfEmail)
        ? "Sent"
        : "Received";
      const dateHeader = headerValue(detail.payload.headers, "Date");
      const date = dateHeader ? new Date(dateHeader).toISOString().slice(0, 10) : "";

      return {
        id: detail.id,
        threadId: detail.threadId,
        subject: headerValue(detail.payload.headers, "Subject") || "(no subject)",
        date,
        direction,
        snippet: detail.snippet ?? "",
      };
    })
  );

  return messages.sort((a, b) => (a.date < b.date ? 1 : -1));
}
