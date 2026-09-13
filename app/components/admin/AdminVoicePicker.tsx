"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { useToast } from "@/app/components/Toast";
import { fetchJson } from "@/lib/fetch-json";

const PAGE_SIZE = 12;

export type AdminVoiceOption = {
  id: string;
  name: string;
};

type Props = {
  selectedVoiceId: string;
  /** Bump after Configure save so the catalog reloads. */
  reloadToken: number;
  busy?: boolean;
  onSelect: (voice: AdminVoiceOption) => Promise<void> | void;
};

export function AdminVoicePicker({
  selectedVoiceId,
  reloadToken,
  busy = false,
  onSelect,
}: Props) {
  const { toast } = useToast();
  const [voices, setVoices] = useState<AdminVoiceOption[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingPlayId, setLoadingPlayId] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const previewGenRef = useRef(0);
  const selectingRef = useRef(false);

  const stopPreview = useCallback((opts?: { gen?: number }) => {
    if (opts?.gen != null && opts.gen !== previewGenRef.current) return;
    const audio = audioRef.current;
    if (audio) {
      // Clearing src without removing handlers fires onerror → false "Could not play" toast.
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPlayingId(null);
    setLoadingPlayId(null);
  }, []);

  useEffect(() => () => stopPreview(), [stopPreview]);

  const loadVoices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchJson<{
        voices?: AdminVoiceOption[];
        error?: string;
      }>("/api/admin/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "voice", apiKey: "" }),
      });
      const next = Array.isArray(res.voices) ? res.voices : [];
      setVoices(next);
      setVisibleCount(PAGE_SIZE);
    } catch (err) {
      setVoices([]);
      setError(err instanceof Error ? err.message : "Could not load voices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVoices();
  }, [loadVoices, reloadToken]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || visibleCount >= voices.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((n) => Math.min(n + PAGE_SIZE, voices.length));
        }
      },
      { rootMargin: "240px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleCount, voices.length]);

  const playVoice = async (voice: AdminVoiceOption) => {
    if (playingId === voice.id) {
      previewGenRef.current += 1;
      stopPreview();
      return;
    }

    const gen = ++previewGenRef.current;
    stopPreview();
    setLoadingPlayId(voice.id);

    try {
      const res = await fetch("/api/admin/ai/voice-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId: voice.id }),
      });
      if (gen !== previewGenRef.current) return;
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "Preview failed");
      }
      const blob = await res.blob();
      if (gen !== previewGenRef.current) return;

      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        if (gen === previewGenRef.current) stopPreview({ gen });
      };
      audio.onerror = () => {
        if (gen !== previewGenRef.current) return;
        stopPreview({ gen });
        toast("Could not play this sample", "error");
      };
      setPlayingId(voice.id);
      setLoadingPlayId(null);
      try {
        await audio.play();
      } catch (playErr) {
        if (gen !== previewGenRef.current) return;
        // Interrupted by stop / new preview — audio often already started.
        if (
          playErr instanceof DOMException &&
          playErr.name === "AbortError"
        ) {
          return;
        }
        stopPreview({ gen });
        toast(
          playErr instanceof Error ? playErr.message : "Could not play this sample",
          "error"
        );
      }
    } catch (err) {
      if (gen !== previewGenRef.current) return;
      setLoadingPlayId(null);
      toast(
        err instanceof Error ? err.message : "Preview failed",
        "error"
      );
    }
  };

  const selectVoice = async (voice: AdminVoiceOption) => {
    if (busy || selectingRef.current || voice.id === selectedVoiceId) return;
    selectingRef.current = true;
    setSelecting(true);
    try {
      await onSelect(voice);
      toast(`Using ${voice.name}`);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Could not save voice",
        "error"
      );
    } finally {
      selectingRef.current = false;
      setSelecting(false);
    }
  };

  const visible = voices.slice(0, visibleCount);
  const selectedInList = voices.some((v) => v.id === selectedVoiceId);
  const noKeyError = /no api key/i.test(error);
  const blocked = busy || selecting;

  const listHead = (
    <div className="admin-voice-list-head">
      <div>
        <h2 className="admin-panel-title">Voices</h2>
        <p className="admin-panel-sub">
          {noKeyError
            ? "Add an ElevenLabs API key in Configure to load voices here."
            : "Choose which voice speaks agent lines. Play a short sample, then tick the one to use."}
        </p>
      </div>
      <button
        type="button"
        className="admin-link border-0 bg-transparent p-0"
        onClick={() => void loadVoices()}
        disabled={loading}
      >
        Refresh
      </button>
    </div>
  );

  if (noKeyError && !loading) {
    return (
      <section className="admin-voice-list" aria-label="Voices">
        {listHead}
      </section>
    );
  }

  return (
    <section className="admin-voice-list" aria-label="Voices">
      {listHead}

      {!selectedInList && selectedVoiceId ? (
        <p className="admin-voice-custom-note">
          Current voice uses a custom ID (
          <code className="admin-code">{selectedVoiceId}</code>). Pick a card
          below to replace it, or keep it via Configure.
        </p>
      ) : null}

      {loading && voices.length === 0 ? (
        <p className="admin-conn-idle">Loading voices…</p>
      ) : null}
      {error && !noKeyError ? (
        <p className="admin-conn-fail">{error}</p>
      ) : null}

      {voices.length > 0 ? (
        <>
          <div
            className="admin-voice-grid"
            role="radiogroup"
            aria-label="ElevenLabs voices"
            aria-busy={blocked || undefined}
          >
            {visible.map((voice) => {
              const selected = voice.id === selectedVoiceId;
              const isPlaying = playingId === voice.id;
              const isLoadingPlay = loadingPlayId === voice.id;
              return (
                <article
                  key={voice.id}
                  className={`admin-voice-card${selected ? " is-selected" : ""}${
                    blocked ? " is-busy" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="admin-voice-select"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`Use ${voice.name}`}
                    disabled={blocked}
                    onClick={() => void selectVoice(voice)}
                  >
                    <span
                      className={`admin-voice-check${selected ? " is-on" : ""}`}
                      aria-hidden="true"
                    />
                    <span className="admin-voice-card-body">
                      <span className="admin-voice-name">{voice.name}</span>
                      <span className="admin-voice-id" title={voice.id}>
                        {voice.id}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="admin-voice-play"
                    aria-label={
                      isPlaying
                        ? `Stop ${voice.name} sample`
                        : `Play ${voice.name} sample`
                    }
                    disabled={blocked || isLoadingPlay}
                    onClick={() => void playVoice(voice)}
                  >
                    {isLoadingPlay ? (
                      <Loader2 size={16} className="admin-spin" aria-hidden />
                    ) : isPlaying ? (
                      <Pause size={16} aria-hidden />
                    ) : (
                      <Play size={16} aria-hidden />
                    )}
                  </button>
                </article>
              );
            })}
          </div>
          {visibleCount < voices.length ? (
            <div
              ref={sentinelRef}
              className="admin-voice-lazy"
              aria-hidden="true"
            >
              <Loader2 size={16} className="admin-spin" />
              <span>Loading more…</span>
            </div>
          ) : (
            <p className="admin-voice-count">
              {voices.length} voice{voices.length === 1 ? "" : "s"}
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}
