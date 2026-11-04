import { NextRequest, NextResponse } from "next/server";
import { addInteraction, getLead, listInteractions, updateLead } from "@/lib/airtable";
import { findThreadsForEmail } from "@/lib/gmail";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await getLead(id);
    if (!lead.email) {
      return NextResponse.json(
        { error: "Lead has no email address to search Gmail for" },
        { status: 400 }
      );
    }

    const [messages, existing] = await Promise.all([
      findThreadsForEmail(lead.email),
      listInteractions(id),
    ]);

    const existingIds = new Set(existing.map((i) => i.gmailMessageId).filter(Boolean));
    const newMessages = messages.filter((m) => !existingIds.has(m.id));

    for (const m of newMessages) {
      await addInteraction({
        leadId: id,
        subject: m.subject,
        date: m.date,
        direction: m.direction,
        snippet: m.snippet,
        gmailMessageId: m.id,
      });
    }

    if (messages.length > 0) {
      const latest = messages[0];
      await updateLead(id, {
        lastContactDate: latest.date,
        gmailThreadId: latest.threadId,
      });
    }

    return NextResponse.json({ added: newMessages.length, total: messages.length });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
