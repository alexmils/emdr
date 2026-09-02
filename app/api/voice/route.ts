import { NextResponse } from "next/server";
import { getSettings } from "@/lib/db";
import { synthesizeSpeech } from "@/lib/llm";

export async function POST(request: Request) {
  const { text } = await request.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const settings = await getSettings();
  const audio = await synthesizeSpeech(settings, text);
  if (!audio) {
    return NextResponse.json(
      { error: "Voice not configured. Add ElevenLabs API key in Settings." },
      { status: 503 }
    );
  }

  return new NextResponse(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
