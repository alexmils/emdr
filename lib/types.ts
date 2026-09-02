export type ProtocolPhase =
  | "grounding"
  | "assessment"
  | "desensitization"
  | "installation"
  | "body_scan"
  | "closure";

export type AnimationMode = "dot" | "flash";
export type SoundMode = "mute" | "click" | "pulse" | "tone";
export type RepeatMode = "24" | "infinity";

export interface BlsSettings {
  speedHz: number;
  repeats: RepeatMode;
  setLengthSec: number;
  sound: SoundMode;
  animation: AnimationMode;
  ballColor: string;
  ballSize: number;
  background: string;
  vibrationIntensity: number;
}

export interface Thread {
  id: string;
  title: string;
  phase: ProtocolPhase;
  target?: string;
  negativeCognition?: string;
  positiveCognition?: string;
  suds?: number;
  voc?: number;
  summary?: string;
  incomplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  role: "agent" | "user";
  content: string;
  createdAt: string;
}

export interface Memory {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface MemorySet {
  id: string;
  name: string;
  memoryIds: string[];
}

export interface ThreadMemorySet {
  threadId: string;
  setId: string;
  enabled: boolean;
}

export type AiProvider = "deepseek" | "openai" | "claude";

export interface ConnectorConfig {
  apiKey: string;
  model: string;
  enabled: boolean;
}

export interface AppSettings {
  autoVoice: boolean;
  defaultAiProvider: AiProvider;
  connectors: {
    deepseek: ConnectorConfig;
    openai: ConnectorConfig;
    claude: ConnectorConfig;
    elevenlabs: ConnectorConfig & { voiceId: string };
  };
}

export const DEFAULT_BLS: BlsSettings = {
  speedHz: 1.0,
  repeats: "24",
  setLengthSec: 38,
  sound: "click",
  animation: "dot",
  ballColor: "#111111",
  ballSize: 48,
  background: "#ffffff",
  vibrationIntensity: 0.5,
};

export const DEFAULT_SETTINGS: AppSettings = {
  autoVoice: false,
  defaultAiProvider: "deepseek",
  connectors: {
    deepseek: { apiKey: "", model: "deepseek-chat", enabled: false },
    openai: { apiKey: "", model: "gpt-4o-mini", enabled: false },
    claude: { apiKey: "", model: "claude-3-5-haiku-latest", enabled: false },
    elevenlabs: {
      apiKey: "",
      model: "eleven_multilingual_v2",
      enabled: false,
      voiceId: "EXAVITQu4vr4xnSDxMaL",
    },
  },
};
