"use client";

import {
  Check,
  Eye,
  FileIcon,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  EMAIL_ATTACHMENT_ACCEPT,
  EMAIL_IMAGE_ACCEPT,
  getEmailAssetPreviewUrl,
  isAllowedEmailAttachmentMime,
  isAllowedEmailImageMime,
  isImageMime,
  listEmailAssets,
  resolveClientMimeType,
  softDeleteEmailAsset,
  uploadEmailAsset,
  type EmailLibraryAsset,
} from "@/utils/api/emailAssets";

type Mode = "attach" | "insert";
type ConfirmStep = null | "placement";

interface EmailAssetLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** attach = all supported email files; insert = images only */
  mode: Mode;
  onSelectAttach: (assets: EmailLibraryAsset[]) => void;
  onSelectInline: (assets: EmailLibraryAsset[]) => void;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function AssetThumb({
  asset,
  selected,
  previewUrl,
  onToggle,
  onPreview,
  onRemove,
}: {
  asset: EmailLibraryAsset;
  selected: boolean;
  previewUrl?: string;
  onToggle: () => void;
  onPreview: () => void;
  onRemove: (e: React.MouseEvent) => void;
}) {
  const isImage = isImageMime(asset.mimeType);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl border bg-slate-50 transition",
        selected
          ? "border-slate-900 ring-2 ring-slate-900/20"
          : "border-slate-200 hover:border-slate-300"
      )}
    >
      {isImage && previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={asset.fileName}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-slate-400">
          <FileIcon className="h-8 w-8" />
          <span className="line-clamp-2 text-center text-[10px] leading-tight text-slate-500">
            {asset.mimeType.split("/").pop()?.toUpperCase() || "FILE"}
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-2 pb-2 pt-8">
        <p className="truncate text-[11px] font-medium text-white drop-shadow-sm">
          {asset.fileName}
        </p>
        <p className="truncate text-[10px] text-white/75">{formatSize(asset.size)}</p>
      </div>

      <div
        className={cn(
          "absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border transition",
          selected
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-white/80 bg-white/80 text-transparent group-hover:border-slate-300"
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </div>

      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
        {isImage ? (
          <button
            type="button"
            title="Preview"
            className="rounded-full bg-white/90 p-1.5 text-slate-700 shadow-sm hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          title="Remove from library"
          className="rounded-full bg-white/90 p-1.5 text-slate-500 shadow-sm hover:bg-white hover:text-red-600"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function EmailAssetLibraryModal({
  open,
  onOpenChange,
  mode,
  onSelectAttach,
  onSelectInline,
}: EmailAssetLibraryModalProps) {
  const [assets, setAssets] = useState<EmailLibraryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [thumbUrls, setThumbUrls] = useState<Record<number, string>>({});
  const [previewAsset, setPreviewAsset] = useState<EmailLibraryAsset | null>(null);
  const [confirmStep, setConfirmStep] = useState<ConfirmStep>(null);
  const [pickingFile, setPickingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickingFileRef = useRef(false);
  const uploadingRef = useRef(false);
  const fileInputId = useId();

  const imagesOnly = mode === "insert";
  const accept = imagesOnly ? EMAIL_IMAGE_ACCEPT : EMAIL_ATTACHMENT_ACCEPT;
  // Keep the native <input> alive even if Radix briefly tries to dismiss the dialog.
  const keepFileInputMounted = open || pickingFile || uploading;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listEmailAssets();
      setAssets(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSelectedIds(new Set());
    setPreviewAsset(null);
    setConfirmStep(null);
    void refresh();
  }, [open, refresh]);

  useEffect(() => {
    uploadingRef.current = uploading;
  }, [uploading]);

  // Clear "picking" after the OS dialog closes without a selection (cancel).
  useEffect(() => {
    if (!pickingFile) return;

    const clearIfCancelled = () => {
      window.setTimeout(() => {
        if (pickingFileRef.current && !uploadingRef.current) {
          pickingFileRef.current = false;
          setPickingFile(false);
        }
      }, 400);
    };

    window.addEventListener("focus", clearIfCancelled);
    return () => window.removeEventListener("focus", clearIfCancelled);
  }, [pickingFile]);

  const visibleAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (!isAllowedEmailAttachmentMime(asset.mimeType)) return false;
      if (imagesOnly) return isAllowedEmailImageMime(asset.mimeType);
      return true;
    });
  }, [assets, imagesOnly]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const images = visibleAssets.filter((a) => isImageMime(a.mimeType));
    void (async () => {
      const next: Record<number, string> = {};
      await Promise.all(
        images.map(async (asset) => {
          try {
            next[asset.id] = await getEmailAssetPreviewUrl(asset.id);
          } catch {
            // keep tile without preview
          }
        })
      );
      if (!cancelled) setThumbUrls((prev) => ({ ...prev, ...next }));
    })();
    return () => {
      cancelled = true;
    };
  }, [visibleAssets, open]);

  const selectedAssets = useMemo(
    () => visibleAssets.filter((a) => selectedIds.has(a.id)),
    [visibleAssets, selectedIds]
  );

  const selectedImages = useMemo(
    () => selectedAssets.filter((a) => isImageMime(a.mimeType)),
    [selectedAssets]
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const beginFilePick = () => {
    pickingFileRef.current = true;
    setPickingFile(true);
  };

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      pickingFileRef.current = false;
      setPickingFile(false);

      const list = Array.from(files);
      if (list.length === 0) return;

      setUploading(true);
      toast.loading("Uploading…", { id: "email-asset-upload" });
      const uploaded: EmailLibraryAsset[] = [];
      try {
        for (const file of list) {
          const mime = resolveClientMimeType(file);
          if (imagesOnly && !isAllowedEmailImageMime(mime)) {
            toast.error(
              `"${file.name}" is not an image. Choose PNG, JPG, GIF, or WebP.`
            );
            continue;
          }
          if (!isAllowedEmailAttachmentMime(mime)) {
            toast.error(`"${file.name}" is not a supported email file type.`);
            continue;
          }
          const asset = await uploadEmailAsset(file);
          uploaded.push(asset);
        }

        if (uploaded.length === 0) {
          toast.error("No files were uploaded", { id: "email-asset-upload" });
          return;
        }

        setAssets((prev) => [...uploaded, ...prev]);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          uploaded.forEach((a) => next.add(a.id));
          return next;
        });
        toast.success(
          uploaded.length === 1
            ? "File uploaded"
            : `${uploaded.length} files uploaded`,
          { id: "email-asset-upload" }
        );
      } catch (error: any) {
        console.error("Email asset upload failed:", error);
        toast.error(
          error?.response?.data?.message || error?.message || "Upload failed",
          { id: "email-asset-upload" }
        );
      } finally {
        setUploading(false);
      }
    },
    [imagesOnly]
  );

  const handleUploadRef = useRef(handleUpload);
  handleUploadRef.current = handleUpload;

  const handleRemove = async (asset: EmailLibraryAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await softDeleteEmailAsset(asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(asset.id);
        return next;
      });
      if (previewAsset?.id === asset.id) setPreviewAsset(null);
      toast.success("Removed from library");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to remove file");
    }
  };

  const finishAttach = (list: EmailLibraryAsset[]) => {
    if (list.length === 0) return;
    onSelectAttach(list);
    onOpenChange(false);
  };

  const finishInline = (list: EmailLibraryAsset[]) => {
    const images = list.filter((a) => isImageMime(a.mimeType));
    if (images.length === 0) {
      toast.error("Only images can be inserted into the email body");
      return;
    }
    onSelectInline(images);
    onOpenChange(false);
  };

  const handleAddClick = () => {
    if (selectedAssets.length === 0) {
      toast.error("Select at least one file");
      return;
    }

    if (mode === "attach") {
      finishAttach(selectedAssets);
      return;
    }

    // Image mode: ask inline vs attachment on final Add
    setConfirmStep("placement");
  };

  return (
    <>
      {keepFileInputMounted && typeof document !== "undefined"
        ? createPortal(
            <input
              id={fileInputId}
              ref={fileInputRef}
              type="file"
              multiple
              accept={accept}
              tabIndex={-1}
              aria-hidden
              // Outside every Dialog so Radix dismiss/unmount cannot kill onChange.
              style={{
                position: "fixed",
                left: "-9999px",
                top: 0,
                width: 1,
                height: 1,
                opacity: 0,
              }}
              onChange={(e) => {
                const files = e.target.files
                  ? Array.from(e.target.files)
                  : [];
                e.target.value = "";
                if (files.length > 0) {
                  void handleUploadRef.current(files);
                } else {
                  pickingFileRef.current = false;
                  setPickingFile(false);
                }
              }}
            />,
            document.body
          )
        : null}

    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Don't close while the OS file picker is open / upload in flight.
        if (!next && (pickingFileRef.current || pickingFile || uploading)) {
          return;
        }
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="!fixed left-1/2 top-1/2 z-[220] flex h-[min(88vh,820px)] w-[min(96vw,920px)] max-w-[920px] -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-hidden p-0 sm:max-w-[920px]"
        overlayClassName="z-[210]"
        onPointerDownOutside={(e) => {
          if (pickingFileRef.current || pickingFile || uploading) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          e.preventDefault();
          e.stopPropagation();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onFocusOutside={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <DialogHeader className="flex-shrink-0 space-y-1 border-b border-slate-200 px-5 py-4 text-left">
          <DialogTitle className="text-base font-semibold tracking-tight text-slate-900">
            {imagesOnly ? "Image library" : "File library"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {imagesOnly
              ? "Select images to insert or attach. Only PNG, JPG, GIF, and WebP are shown."
              : "Select files supported for email (PDF, Office docs, images, and media)."}
          </DialogDescription>
        </DialogHeader>

        {confirmStep === "placement" ? (
          <div className="flex flex-1 flex-col justify-center gap-5 px-6 py-8">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Add {selectedImages.length} image
                {selectedImages.length === 1 ? "" : "s"} as…
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Inline shows in the email body. Attachment is a downloadable file.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-5 text-left transition hover:border-slate-900 hover:bg-slate-50"
                onClick={() => finishInline(selectedImages)}
              >
                <Eye className="mb-2 h-5 w-5 text-slate-700" />
                <p className="text-sm font-semibold text-slate-900">Show inline</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Insert into the email body so recipients see the image.
                </p>
              </button>
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-5 text-left transition hover:border-slate-900 hover:bg-slate-50"
                onClick={() => finishAttach(selectedImages)}
              >
                <Paperclip className="mb-2 h-5 w-5 text-slate-700" />
                <p className="text-sm font-semibold text-slate-900">Attach as document</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Send as a file attachment, not in the message body.
                </p>
              </button>
            </div>
            <button
              type="button"
              className="self-start text-xs text-slate-500 underline"
              onClick={() => setConfirmStep(null)}
            >
              Back to library
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor={uploading ? undefined : fileInputId}
                  onClick={(e) => {
                    if (uploading) {
                      e.preventDefault();
                      return;
                    }
                    beginFilePick();
                  }}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800",
                    uploading && "pointer-events-none opacity-60"
                  )}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "Uploading…" : "Upload"}
                </label>
                {selectedIds.size > 0 ? (
                  <button
                    type="button"
                    className="text-xs text-slate-500 underline"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Clear selection
                  </button>
                ) : null}
              </div>
              <p className="text-xs text-slate-400">
                {selectedIds.size > 0
                  ? `${selectedIds.size} selected`
                  : `${visibleAssets.length} file${visibleAssets.length === 1 ? "" : "s"}`}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : visibleAssets.length === 0 ? (
                <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 text-center">
                  <Upload className="mb-3 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-700">
                    {imagesOnly ? "No images yet" : "No files yet"}
                  </p>
                  <p className="mt-1 max-w-sm text-xs text-slate-500">
                    {imagesOnly
                      ? "Upload PNG, JPG, GIF, or WebP to get started."
                      : "Upload a supported email file (PDF, Office docs, images, or media)."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {visibleAssets.map((asset) => (
                    <AssetThumb
                      key={asset.id}
                      asset={asset}
                      selected={selectedIds.has(asset.id)}
                      previewUrl={thumbUrls[asset.id]}
                      onToggle={() => toggleSelect(asset.id)}
                      onPreview={() => setPreviewAsset(asset)}
                      onRemove={(e) => void handleRemove(asset, e)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3">
              <p className="text-xs text-slate-500">
                {mode === "attach"
                  ? "Selected files will be added as attachments."
                  : "Next you’ll choose show inline or attach as document."}
              </p>
              <button
                type="button"
                disabled={selectedIds.size === 0 || uploading}
                onClick={handleAddClick}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
              </button>
            </div>
          </>
        )}

        {previewAsset && thumbUrls[previewAsset.id] ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 p-6"
            onClick={() => setPreviewAsset(null)}
          >
            <div
              className="relative max-h-full max-w-full overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                onClick={() => setPreviewAsset(null)}
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrls[previewAsset.id]}
                alt={previewAsset.fileName}
                className="max-h-[70vh] max-w-[min(80vw,720px)] object-contain"
              />
              <div className="border-t border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-medium text-slate-900">
                  {previewAsset.fileName}
                </p>
                <p className="text-xs text-slate-500">
                  {formatSize(previewAsset.size)} · {previewAsset.mimeType}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
    </>
  );
}
