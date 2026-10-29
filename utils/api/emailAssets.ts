import emailClient from "@/utils/api/emailClient";

export type EmailLibraryAsset = {
  id: number;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt?: string | Date;
  deletedAt?: string | Date | null;
};

export type EmailAttachmentRef = {
  assetId: number;
  fileName?: string;
  mimeType?: string;
  size?: number;
};

export const MAX_EMAIL_ATTACHMENTS = 5;
export const MAX_EMAIL_INLINE_ASSETS = 10;
export const MAX_EMAIL_ASSET_FILE_BYTES = 7 * 1024 * 1024;

/** Mirrors email-service attachment allowlist. */
export const EMAIL_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
] as const;

export const EMAIL_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
] as const;

export const EMAIL_ATTACHMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.mp3,.wav," +
  EMAIL_ATTACHMENT_MIME_TYPES.join(",");

export const EMAIL_IMAGE_ACCEPT =
  "image/png,image/jpeg,image/jpg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp";

const previewUrlCache = new Map<number, string>();

function inferMimeFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  const byExt: Record<string, string> = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
  };
  for (const [ext, mime] of Object.entries(byExt)) {
    if (lower.endsWith(ext)) return mime;
  }
  return "application/octet-stream";
}

export function resolveClientMimeType(file: File): string {
  const trimmed = String(file.type || "").trim().toLowerCase();
  if (trimmed && trimmed !== "application/octet-stream") return trimmed;
  return inferMimeFromFileName(file.name);
}

export function isAllowedEmailAttachmentMime(mimeType: string): boolean {
  return (EMAIL_ATTACHMENT_MIME_TYPES as readonly string[]).includes(
    mimeType.toLowerCase()
  );
}

export function isAllowedEmailImageMime(mimeType: string): boolean {
  const m = mimeType.toLowerCase();
  return (EMAIL_IMAGE_MIME_TYPES as readonly string[]).includes(m) || m === "image/jpg";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function listEmailAssets(): Promise<EmailLibraryAsset[]> {
  const response = await emailClient.get("/api/email-assets");
  return response.data?.data ?? [];
}

export async function uploadEmailAsset(file: File): Promise<EmailLibraryAsset> {
  if (file.size > MAX_EMAIL_ASSET_FILE_BYTES) {
    throw new Error("File exceeds the 7MB limit");
  }
  const mimeType = resolveClientMimeType(file);
  if (!isAllowedEmailAttachmentMime(mimeType)) {
    throw new Error(
      "File type not allowed. Use PDF, Office docs, PNG, JPG, GIF, WebP, MP4, WebM, MP3, or WAV."
    );
  }
  const base64 = await fileToBase64(file);
  const response = await emailClient.post("/api/email-assets", {
    fileBuffer: base64,
    fileName: file.name,
    mimeType,
  });
  return response.data?.data;
}

export async function softDeleteEmailAsset(assetId: number): Promise<void> {
  await emailClient.delete(`/api/email-assets/${assetId}`);
}

/** Fetch private asset bytes with auth and return a blob: URL for editor preview. */
export async function getEmailAssetPreviewUrl(assetId: number): Promise<string> {
  const cached = previewUrlCache.get(assetId);
  if (cached) return cached;

  const response = await emailClient.get(`/api/email-assets/${assetId}/content`, {
    responseType: "blob",
  });
  const blobUrl = URL.createObjectURL(response.data as Blob);
  previewUrlCache.set(assetId, blobUrl);
  return blobUrl;
}

export function revokeEmailAssetPreviewUrl(assetId: number): void {
  const url = previewUrlCache.get(assetId);
  if (url) {
    URL.revokeObjectURL(url);
    previewUrlCache.delete(assetId);
  }
}

export function isImageMime(mimeType: string | undefined | null): boolean {
  return Boolean(mimeType && /^image\//i.test(mimeType));
}

export function extractInlineAssetIds(html: string): number[] {
  if (!html) return [];
  const ids = new Set<number>();
  const re = /data-asset-id\s*=\s*["']?(\d+)["']?/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const id = Number(match[1]);
    if (Number.isFinite(id) && id > 0) ids.add(id);
  }
  return Array.from(ids);
}

/**
 * Persistable HTML: keep data-asset-id, normalize src to asset://{id}
 * so we never store blob: or short-lived signed URLs.
 */
export function normalizeEmailHtmlAssetSrcs(html: string): string {
  if (!html || typeof document === "undefined") return html || "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("img[data-asset-id]").forEach((img) => {
    const id = Number(img.getAttribute("data-asset-id"));
    if (!Number.isFinite(id) || id <= 0) return;
    img.setAttribute("src", `asset://${id}`);
  });
  return doc.body.innerHTML;
}

/** Hydrate asset:// or empty src with authenticated blob URLs for the editor. */
export async function hydrateEmailHtmlAssetSrcs(html: string): Promise<string> {
  if (!html || typeof document === "undefined") return html || "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const imgs = Array.from(doc.querySelectorAll("img[data-asset-id]"));
  await Promise.all(
    imgs.map(async (img) => {
      const id = Number(img.getAttribute("data-asset-id"));
      if (!Number.isFinite(id) || id <= 0) return;
      try {
        const url = await getEmailAssetPreviewUrl(id);
        img.setAttribute("src", url);
      } catch {
        img.setAttribute("alt", img.getAttribute("alt") || "Image unavailable");
      }
    })
  );
  return doc.body.innerHTML;
}

export function estimateAttachmentBytes(
  attachments: EmailAttachmentRef[],
  inlineIds: number[],
  library: EmailLibraryAsset[]
): number {
  const byId = new Map(library.map((a) => [a.id, a]));
  let total = 0;
  const counted = new Set<number>();
  for (const ref of attachments) {
    if (counted.has(ref.assetId)) continue;
    counted.add(ref.assetId);
    total += ref.size ?? byId.get(ref.assetId)?.size ?? 0;
  }
  for (const id of inlineIds) {
    if (counted.has(id)) continue;
    counted.add(id);
    total += byId.get(id)?.size ?? 0;
  }
  return total;
}
