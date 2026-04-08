/**
 * AssetFileList — renders a list of FileRef items with MediaPlayer.
 * First file renders full (compact=false); subsequent files render compact.
 * Uses useFileUrl to resolve each file's blob-gateway URL.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Download } from "lucide-react";
import type { FileRef } from "../backend-types";
import { useFileUrl } from "../hooks/useFileStorage";
import MediaPlayer from "./MediaPlayer";

// ─── Single file row ──────────────────────────────────────────────────────────

function FileItem({
  fileRef,
  compact,
}: {
  fileRef: FileRef;
  compact: boolean;
}) {
  const { data: url, isLoading, isError } = useFileUrl(fileRef.fileId);

  if (isLoading) {
    return (
      <Skeleton
        className={
          compact ? "h-24 w-full rounded-lg" : "h-48 w-full rounded-xl"
        }
        data-ocid="asset-file-skeleton"
      />
    );
  }

  if (isError || !url) {
    return (
      <div
        className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive"
        data-ocid="asset-file-error"
      >
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 truncate min-w-0">
          Could not load <span className="font-medium">{fileRef.filename}</span>
        </span>
        {/* If we somehow have a URL despite the error state, show a download link */}
        {url && (
          <a
            href={url}
            download={fileRef.filename}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1 text-xs underline"
            aria-label={`Download ${fileRef.filename}`}
          >
            <Download className="h-3 w-3" />
            Download
          </a>
        )}
      </div>
    );
  }

  return (
    <MediaPlayer
      fileRef={fileRef}
      url={url}
      compact={compact}
      data-ocid="asset-file-player"
    />
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

interface AssetFileListProps {
  fileRefs: FileRef[];
  className?: string;
}

export default function AssetFileList({
  fileRefs,
  className,
}: AssetFileListProps) {
  if (fileRefs.length === 0) return null;

  const [first, ...rest] = fileRefs;

  return (
    <div className={className} data-ocid="asset-file-list">
      {/* First file: full player */}
      <FileItem key={first.fileId} fileRef={first} compact={false} />

      {/* Additional files: compact in a scrollable list */}
      {rest.length > 0 && (
        <div className="mt-3 space-y-2">
          {rest.map((ref) => (
            <FileItem key={ref.fileId} fileRef={ref} compact />
          ))}
        </div>
      )}
    </div>
  );
}
