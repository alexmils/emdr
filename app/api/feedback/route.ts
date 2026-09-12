import { NextResponse } from "next/server";
import { isAuthContext, requireAuth } from "@/lib/api-auth";
import {
  getFeedbackPromptForUser,
  markFeedbackSessionEnd,
  recordFeedbackShown,
  snoozeFeedbackPrompt,
  submitFeedbackResponse,
} from "@/lib/feedback-db";
import { isValidFeedbackScore } from "@/lib/feedback";

export async function GET() {
  const auth = await requireAuth();
  if (!isAuthContext(auth)) return auth;

  const prompt = await getFeedbackPromptForUser({
    userId: auth.user.id,
    userCreatedAt: auth.user.createdAt,
  });
  return NextResponse.json(prompt);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!isAuthContext(auth)) return auth;

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    score?: number;
    comment?: string | null;
  };

  if (body.action === "session_end") {
    const result = await markFeedbackSessionEnd(auth.user.id);
    return NextResponse.json(result);
  }

  if (body.action === "snooze") {
    await snoozeFeedbackPrompt(auth.user.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "shown") {
    await recordFeedbackShown(auth.user.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "submit") {
    if (!isValidFeedbackScore(body.score)) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }
    const result = await submitFeedbackResponse({
      userId: auth.user.id,
      userCreatedAt: auth.user.createdAt,
      score: body.score,
      comment: body.comment,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: true, feedback: result.feedback });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
