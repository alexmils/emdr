"use client";

/** Resize/compress an image file to a JPEG data URL suitable for avatar storage. */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  return fileToImageDataUrl(file, 256, 0.85);
}

/** Cover images for Resources CMS — larger than avatars. */
export async function fileToResourceCoverDataUrl(file: File): Promise<string> {
  return fileToImageDataUrl(file, 960, 0.82);
}

async function fileToImageDataUrl(
  file: File,
  maxEdge: number,
  quality: number
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}
