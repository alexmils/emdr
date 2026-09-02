import { NextResponse } from "next/server";
import {
  addMessage,
  getEnabledMemoryContext,
  getSettings,
  getThread,
  listMessages,
  updateThread,
} from "@/lib/db";
import { chatCompletion } from "@/lib/llm";
import { checkInLine, openingLine, systemPromptForPhase } from "@/lib/protocol";

export async function POST(request: Request) {
  const body = await request.json();
  const { threadId, userMessage, bootstrap, afterSet } = body as {
    threadId: string;
    userMessage?: string;
    bootstrap?: boolean;
    afterSet?: boolean;
  };

  const thread = await getThread(threadId);
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const settings = await getSettings();
  const memoryContext = await getEnabledMemoryContext(threadId);
  const history = await listMessages(threadId);

  if (bootstrap && history.length === 0) {
    const line = openingLine(thread.phase);
    const msg = await addMessage(threadId, "agent", line);
    return NextResponse.json({ message: msg });
  }

  if (afterSet) {
    const line = checkInLine(thread.phase);
    const msg = await addMessage(threadId, "agent", line);
    return NextResponse.json({ message: msg });
  }

  if (userMessage) {
    await addMessage(threadId, "user", userMessage);
  }

  const messages = [
    {
      role: "system" as const,
      content: systemPromptForPhase(thread.phase, memoryContext),
    },
    ...(await listMessages(threadId)).map((m) => ({
      role: (m.role === "agent" ? "assistant" : "user") as
        | "assistant"
        | "user",
      content: m.content,
    })),
  ];

  try {
    const reply = await chatCompletion(settings, messages);
    const agentMsg = await addMessage(threadId, "agent", reply.trim());

    if (thread.phase === "grounding" && userMessage && userMessage.length > 2) {
      await updateThread(threadId, { phase: "assessment" });
    }

    if (thread.phase === "assessment" && userMessage) {
      const sudsMatch = userMessage.match(/\b(\d{1,2})\b/);
      if (sudsMatch) {
        const suds = parseInt(sudsMatch[1], 10);
        if (suds >= 0 && suds <= 10) {
          await updateThread(threadId, { suds, phase: "desensitization" });
        }
      }
    }

    if (thread.phase === "desensitization" && userMessage) {
      const sudsMatch = userMessage.match(/\b(\d{1,2})\b/);
      if (sudsMatch) {
        const suds = parseInt(sudsMatch[1], 10);
        if (suds >= 0 && suds <= 1) {
          await updateThread(threadId, { suds, phase: "installation" });
        } else if (suds >= 0 && suds <= 10) {
          await updateThread(threadId, { suds });
        }
      }
    }

    return NextResponse.json({ message: agentMsg });
  } catch (e) {
    const fallback =
      "I'm here with you. Take a breath. What do you notice now? (Configure an AI provider in Settings to enable full guidance.)";
    const agentMsg = await addMessage(threadId, "agent", fallback);
    return NextResponse.json({
      message: agentMsg,
      warning: e instanceof Error ? e.message : "LLM error",
    });
  }
}
