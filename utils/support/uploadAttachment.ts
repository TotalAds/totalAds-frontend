export type UploadedSupportAttachment = {
  filename: string;
  contentType: string;
  sizeBytes: number;
  s3Key: string;
};

export type PresignedUploadResponse = {
  presigned: {
    url: string;
    fields: Record<string, string>;
    expiresAt: string;
  };
  s3Key: string;
};

/** Upload a file to S3 using a presigned POST policy from the support API. */
export async function uploadFileToPresignedPost(
  url: string,
  fields: Record<string, string>,
  file: File
): Promise<void> {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  formData.append("file", file);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Attachment upload failed (${response.status})`);
  }
}

export function isImageAttachment(contentType: string): boolean {
  return contentType.startsWith("image/");
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const SUPPORT_FILE_ACCEPT =
  "image/png,image/jpeg,image/gif,image/webp,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx";

export const MAX_SUPPORT_FILE_BYTES = 10 * 1024 * 1024;
