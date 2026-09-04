import { NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/llm";
import { getLlmRuntimeConfig } from "@/lib/platform-settings";
import { withAuth } from "@/lib/api-auth";

export async function POST(request: Request) {
  return withAuth(async () => {
    const { text } = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const settings = await getLlmRuntimeConfig();
    const audio = await synthesizeSpeech(settings, text);
    if (!audio) {
      return NextResponse.json(
        {
          error:
            "Voice not configured. Ask a platform admin to set the Voice API key.",
        },
        { status: 503 }
      );
    }

    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  });
}
