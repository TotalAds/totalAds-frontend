"use client";

import {
  IconDownload,
  IconFile,
  IconPhoto,
} from "@tabler/icons-react";

import type { SupportAttachment } from "@/app/help/types";
import {
  formatFileSize,
  isImageAttachment,
} from "@/utils/support/uploadAttachment";

type TicketAttachmentsProps = {
  attachments: SupportAttachment[];
  /** Light bubbles use dark text links; admin bubbles use light text. */
  tone?: "light" | "dark";
};

function attachmentHref(att: SupportAttachment): string {
  return att.url ?? "#";
}

export function TicketAttachments({
  attachments,
  tone = "light",
}: TicketAttachmentsProps) {
  if (!attachments.length) return null;

  const images = attachments.filter((att) => isImageAttachment(att.contentType));
  const files = attachments.filter((att) => !isImageAttachment(att.contentType));

  const linkClass =
    tone === "dark"
      ? "text-white/90 hover:text-white underline-offset-2 hover:underline"
      : "text-text-100 hover:text-brand-main underline-offset-2 hover:underline";

  return (
    <div className="mt-4 space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {images.map((att) => (
            <a
              key={att.id}
              href={attachmentHref(att)}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden rounded-lg border border-bg-300 bg-bg-100 aspect-square"
            >
              {att.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={att.url}
                  alt={att.filename}
                  className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-text-300">
                  <IconPhoto className="h-8 w-8" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                <p className="truncate text-[11px] text-white">{att.filename}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((att) => (
            <li key={att.id}>
              <a
                href={attachmentHref(att)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex max-w-full items-center gap-2 rounded-lg border border-bg-300 bg-bg-100/80 px-3 py-2 text-xs ${linkClass}`}
              >
                <IconFile className="h-4 w-4 shrink-0" />
                <span className="truncate">{att.filename}</span>
                <span className="shrink-0 opacity-70">
                  ({formatFileSize(att.sizeBytes)})
                </span>
                <IconDownload className="h-3.5 w-3.5 shrink-0 opacity-60" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type PendingFileProps = {
  files: File[];
  onRemove: (index: number) => void;
  disabled?: boolean;
};

export function PendingAttachmentList({
  files,
  onRemove,
  disabled,
}: PendingFileProps) {
  if (files.length === 0) return null;

  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
      {files.map((file, index) => {
        const preview = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null;

        return (
          <li
            key={`${file.name}-${index}`}
            className="flex items-center gap-3 rounded-lg border border-bg-300 bg-bg-200 px-3 py-2"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="h-10 w-10 rounded object-cover shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-bg-300">
                <IconFile className="h-5 w-5 text-text-300" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text-100">{file.name}</p>
              <p className="text-xs text-text-300">{formatFileSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={disabled}
              className="text-text-300 hover:text-red-500 transition-colors disabled:opacity-50"
              aria-label={`Remove ${file.name}`}
            >
              ×
            </button>
          </li>
        );
      })}
    </ul>
  );
}
