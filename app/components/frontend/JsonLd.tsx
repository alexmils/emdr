import { serializeJsonLd } from "@/lib/json-ld";

/** Server-safe JSON-LD script. Escapes `<` so the payload cannot break HTML. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
