import { createServerClient } from "./server";
import { generateId } from "../password";

const BUCKET = "payment-screenshots";
const MAX_BYTES = 4.5 * 1024 * 1024; // 4.5 MB
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export interface UploadResult {
  url: string;
  path: string;
  /** "storage" if uploaded to Supabase Storage, "data-url" if fallback. */
  kind: "storage" | "data-url";
}

/**
 * Uploads a payment screenshot to the `payment-screenshots` Supabase Storage
 * bucket. Falls back to a base64 data URL when Storage is unavailable
 * (e.g. bucket not created yet / network) so the admin can still review it.
 *
 * @param fileBuffer raw bytes
 * @param mimeType   image/png | image/jpeg | image/webp
 * @param userId     used to namespace the storage path
 */
export async function uploadPaymentScreenshot(
  fileBuffer: ArrayBuffer,
  mimeType: string,
  userId: string
): Promise<UploadResult> {
  if (!ALLOWED.includes(mimeType)) {
    throw new Error(
      "Invalid file type. Please upload a PNG, JPG, or WEBP image."
    );
  }
  if (fileBuffer.byteLength > MAX_BYTES) {
    throw new Error("File too large. Maximum size is 4.5 MB.");
  }

  const ext =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : "jpg";
  const storagePath = `${userId}/${generateId()}.${ext}`;

  const sb = createServerClient();
  try {
    const { error } = await sb.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
        cacheControl: "3600",
      });
    if (error) throw error;
    const { data } = sb.storage.from(BUCKET).getPublicUrl(storagePath);
    if (data?.publicUrl) {
      return { url: data.publicUrl, path: storagePath, kind: "storage" };
    }
    throw new Error("No public URL returned");
  } catch {
    // Fallback: embed as data URL so the admin can still review the screenshot.
    const base64 = Buffer.from(fileBuffer).toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;
    return { url: dataUrl, path: storagePath, kind: "data-url" };
  }
}
