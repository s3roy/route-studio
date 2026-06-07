"use client";

import { useCallback, useRef, useState } from "react";
import type { RouteProject } from "@/lib/analyzer";

const MAX_FILES = 400;

type FolderUploadDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: { project: RouteProject; projectName: string }) => void;
};

export function FolderUploadDialog({ open, onClose, onSuccess }: FolderUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setLoading(true);
      setError(null);

      const files = Array.from(fileList).filter((f) => f.size > 0);
      if (files.length === 0) {
        setError("No files selected.");
        setLoading(false);
        return;
      }
      if (files.length > MAX_FILES) {
        setError(`Too many files (max ${MAX_FILES}). Upload a smaller project folder.`);
        setLoading(false);
        return;
      }

      const formData = new FormData();
      for (const file of files) {
        const relativePath =
          (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
        formData.append("files", file);
        formData.append("paths", relativePath);
      }

      try {
        const res = await fetch("/api/import/upload", { method: "POST", body: formData });
        const data = (await res.json()) as
          | { ok: true; project: RouteProject; projectName: string }
          | { ok: false; error: string };

        if (!data.ok) {
          setError(data.error);
          return;
        }

        onSuccess({ project: data.project, projectName: data.projectName });
        onClose();
      } catch {
        setError("Upload failed. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [onClose, onSuccess],
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const items = e.dataTransfer.items;
      if (!items?.length) return;

      const collected: File[] = [];
      const entries = Array.from(items)
        .map((item) => item.webkitGetAsEntry?.())
        .filter(Boolean);

      async function walkEntry(entry: FileSystemEntry, prefix = ""): Promise<void> {
        if (entry.isFile) {
          const file = await new Promise<File>((resolve, reject) => {
            (entry as FileSystemFileEntry).file(resolve, reject);
          });
          Object.defineProperty(file, "webkitRelativePath", {
            value: prefix ? `${prefix}/${file.name}` : file.name,
            configurable: true,
          });
          collected.push(file);
          return;
        }
        if (entry.isDirectory) {
          const reader = (entry as FileSystemDirectoryEntry).createReader();
          const children = await new Promise<FileSystemEntry[]>((resolve, reject) => {
            reader.readEntries(resolve, reject);
          });
          for (const child of children) {
            await walkEntry(child, prefix ? `${prefix}/${entry.name}` : entry.name);
          }
        }
      }

      try {
        for (const entry of entries) {
          if (entry) await walkEntry(entry);
        }
        if (collected.length === 0) {
          setError("Could not read dropped folder. Try the folder picker instead.");
          return;
        }
        await uploadFiles(collected);
      } catch {
        setError("Could not read dropped folder. Try the folder picker instead.");
      }
    },
    [uploadFiles],
  );

  if (!open) return null;

  return (
    <div className="theme-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-labelledby="folder-upload-title"
        className="theme-card theme-border max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border p-6 shadow-xl"
      >
        <h2 id="folder-upload-title" className="theme-text text-base font-semibold">
          Upload local folder
        </h2>
        <p className="theme-muted mt-2 text-sm">
          Drop a Next.js project folder or pick one from disk. We scan{" "}
          <code className="theme-text-secondary">app/</code> or{" "}
          <code className="theme-text-secondary">src/app/</code> — nothing is executed.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
            dragOver
              ? "border-violet-500/50 bg-violet-500/10"
              : "theme-border theme-input"
          }`}
        >
          <p className="theme-text-secondary text-sm font-medium">Drag & drop project folder</p>
          <p className="theme-muted mt-1 text-xs">or</p>
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            Choose folder
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            // @ts-expect-error webkitdirectory is non-standard but widely supported
            webkitdirectory=""
            directory=""
            multiple
            onChange={(e) => {
              const list = e.target.files;
              if (list?.length) void uploadFiles(list);
              e.target.value = "";
            }}
          />
        </div>

        {error ? (
          <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="theme-border theme-hover theme-text-secondary rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
