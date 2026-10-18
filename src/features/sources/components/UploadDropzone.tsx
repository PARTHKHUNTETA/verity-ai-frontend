import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type DragEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/components/ui/cn";
import { errorMessage } from "@/services/api-client";
import { sourcesApi } from "@/services/sources-api";

const ACCEPT = ".pdf,.txt,.md,.markdown";

/** Drag & drop (or click) to upload one or more files; each is uploaded separately. */
export function UploadDropzone({ collectionId }: { collectionId: string }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const notes: string[] = [];
      for (const file of files) {
        try {
          const result = await sourcesApi.upload(collectionId, file);
          if (result.duplicate)
            notes.push(`${file.name}: already uploaded, added to this collection.`);
        } catch (err) {
          notes.push(`${file.name}: ${errorMessage(err)}`);
        }
      }
      return notes;
    },
    onSuccess: (notes) => setMessages(notes),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["collection", collectionId] });
      void queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setMessages([]);
    upload.mutate([...list]);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        disabled={upload.isPending}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          dragging ? "border-brand-500 bg-brand-50" : "border-line bg-surface hover:bg-canvas",
        )}
      >
        <span className="text-ink text-sm font-medium">
          {upload.isPending ? "Uploading…" : "Drop files here or click to upload"}
        </span>
        <span className="text-ink-muted mt-1 text-xs">PDF, .txt or .md · up to 25 MB each</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {messages.length > 0 && (
        <Alert tone="info">
          <ul className="space-y-0.5">
            {messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  );
}
