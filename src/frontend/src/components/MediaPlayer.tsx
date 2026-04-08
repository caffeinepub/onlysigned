/**
 * MediaPlayer — handles video, audio, image, PDF and document file types.
 * Props:
 *   fileRef   – FileRef with mimeType, filename, sizeBytes
 *   url       – resolved blob-gateway URL
 *   className – optional wrapper className
 *   compact   – true = thumbnail+overlay for cards; false = full player
 *
 * MIME routing:
 *   audio/*  → AudioPlayer  (MP3/WAV/OGG/AAC/FLAC/M4A/WebM-audio)
 *   video/*  → VideoPlayer  (MP4/WebM/OGG/MOV/AVI/MKV/3GP)
 *   image/*  → ImageViewer  (JPEG/PNG/GIF/WebP/SVG/BMP/AVIF/ICO)
 *   application/pdf → PdfViewer
 *   unknown  → extension-based re-detection → then FileDownload fallback
 */

import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Download,
  FileText,
  Maximize2,
  Music,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FileRef } from "../backend-types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(s: number) {
  if (!Number.isFinite(s) || Number.isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function fmtBytes(b: bigint) {
  const n = Number(b);
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

// Waveform bar heights (deterministic)
const COMPACT_BARS = [20, 28, 24, 34, 30, 26, 36, 22, 32, 28, 24, 30];
const FULL_BARS = [
  24, 32, 28, 38, 34, 26, 40, 22, 36, 30, 28, 34, 38, 24, 42, 30, 26, 36, 22,
  34, 28, 40, 32, 26, 38, 30, 24, 36, 28, 34, 40, 22, 30, 36, 28, 42, 24, 32,
  36, 28,
];

// ─── MIME-type detection ───────────────────────────────────────────────────────

type MediaKind = "audio" | "video" | "image" | "pdf" | "unknown";

// Canonical MIME types for the <source type> attribute
const AUDIO_MIME_MAP: Record<string, string> = {
  "audio/mpeg": "audio/mpeg",
  "audio/mp3": "audio/mpeg",
  "audio/x-mpeg": "audio/mpeg",
  "audio/wav": "audio/wav",
  "audio/x-wav": "audio/wav",
  "audio/ogg": "audio/ogg",
  "audio/aac": "audio/aac",
  "audio/x-aac": "audio/aac",
  "audio/flac": "audio/flac",
  "audio/x-flac": "audio/flac",
  "audio/webm": "audio/webm",
  "audio/m4a": "audio/mp4",
  "audio/x-m4a": "audio/mp4",
  "audio/mp4": "audio/mp4",
};

const EXT_KIND: Record<string, MediaKind> = {
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  flac: "audio",
  aac: "audio",
  m4a: "audio",
  opus: "audio",
  mp4: "video",
  webm: "video",
  mov: "video",
  avi: "video",
  mkv: "video",
  "3gp": "video",
  m4v: "video",
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  bmp: "image",
  avif: "image",
  ico: "image",
  tiff: "image",
  tif: "image",
  pdf: "pdf",
};

const EXT_MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  aac: "audio/aac",
  m4a: "audio/mp4",
  opus: "audio/ogg; codecs=opus",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
  "3gp": "video/3gpp",
  m4v: "video/mp4",
};

function detectKind(mimeType: string, filename: string): MediaKind {
  const mime = (mimeType ?? "").toLowerCase().trim();
  if (mime.startsWith("audio/") && mime !== "audio/") return "audio";
  if (mime.startsWith("video/") && mime !== "video/") return "video";
  if (mime.startsWith("image/") && mime !== "image/") return "image";
  if (mime === "application/pdf") return "pdf";

  // Fall back to file extension
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXT_KIND[ext] ?? "unknown";
}

/** Return the canonical MIME type to pass to <source type=...> */
function canonicalMime(mimeType: string, filename: string): string {
  const mime = (mimeType ?? "").toLowerCase().trim();
  if (AUDIO_MIME_MAP[mime]) return AUDIO_MIME_MAP[mime];
  if (mime && mime !== "application/octet-stream") return mime;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? "";
}

// ─── LoadError fallback ───────────────────────────────────────────────────────

function LoadError({ url, filename }: { url: string; filename: string }) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-xl bg-muted/20 border border-border/50 px-6 py-8 text-center"
      data-ocid="media-load-error"
    >
      <AlertCircle className="h-8 w-8 text-destructive/70" />
      <p className="text-sm font-medium text-foreground">
        Could not play this file
      </p>
      <p className="text-xs text-muted-foreground max-w-xs">
        Your browser may not support this format. Try downloading it instead.
      </p>
      <a
        href={url}
        download={filename}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 border border-accent/30 rounded-lg px-3 py-2 transition-colors min-h-[44px]"
        data-ocid="media-error-download"
      >
        <Download className="h-3.5 w-3.5" />
        Download {filename}
      </a>
    </div>
  );
}

// ─── VideoPlayer ──────────────────────────────────────────────────────────────

function VideoPlayer({
  url,
  mimeType,
  filename,
  compact,
  className,
}: {
  url: string;
  mimeType: string;
  filename: string;
  compact: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [error, setError] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mime = canonicalMime(mimeType, filename);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress(v.currentTime / v.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const pct = Number(e.target.value) / 100;
    v.currentTime = pct * v.duration;
    setProgress(pct);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    const val = Number(e.target.value) / 100;
    setVolume(val);
    if (v) {
      v.volume = val;
      v.muted = val === 0;
    }
    setMuted(val === 0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const requestFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
  };

  const revealControls = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  };

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (error) return <LoadError url={url} filename={filename} />;

  if (compact) {
    return (
      <button
        type="button"
        className={cn(
          "relative w-full aspect-video bg-background rounded-lg overflow-hidden cursor-pointer group",
          className,
        )}
        aria-label={playing ? "Pause video" : "Play video"}
        onClick={togglePlay}
        data-ocid="media-video-compact"
      >
        {/* biome-ignore lint/a11y/useMediaCaption: captions not available for user-uploaded content */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={(e) =>
            setDuration((e.target as HTMLVideoElement).duration)
          }
          onEnded={() => setPlaying(false)}
          onError={() => setError(true)}
          playsInline
          preload="metadata"
        >
          <source src={url} type={mime || undefined} />
        </video>
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 group-hover:bg-background/20 transition-colors">
          <div className="w-10 h-10 rounded-full bg-accent/90 flex items-center justify-center shadow-lg">
            {playing ? (
              <Pause className="h-4 w-4 text-accent-foreground" />
            ) : (
              <Play className="h-4 w-4 text-accent-foreground ml-0.5" />
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full aspect-video bg-background rounded-xl overflow-hidden select-none",
        className,
      )}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      data-ocid="media-video-full"
    >
      {/* biome-ignore lint/a11y/useMediaCaption: captions not available for user-uploaded content */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => {
          setDuration((e.target as HTMLVideoElement).duration);
        }}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setError(true)}
        playsInline
        preload="metadata"
        title={filename}
      >
        <source src={url} type={mime || undefined} />
      </video>

      {/* Controls overlay */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent px-3 pt-8 pb-3 transition-opacity duration-300",
          showControls || !playing ? "opacity-100" : "opacity-0",
        )}
      >
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress * 100}
          onChange={handleSeek}
          className="w-full h-1.5 accent-accent rounded-full cursor-pointer mb-2.5"
          aria-label="Seek"
          data-ocid="video-progress"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-accent/20 hover:bg-accent/40 flex items-center justify-center transition-colors"
            aria-label={playing ? "Pause" : "Play"}
            data-ocid="video-play-btn"
          >
            {playing ? (
              <Pause className="h-4 w-4 text-accent" />
            ) : (
              <Play className="h-4 w-4 text-accent ml-0.5" />
            )}
          </button>

          <span className="text-xs font-mono text-foreground/70 tabular-nums">
            {fmtTime(videoRef.current?.currentTime ?? 0)} / {fmtTime(duration)}
          </span>

          <div className="flex-1" />

          <button
            type="button"
            onClick={toggleMute}
            className="w-8 h-8 flex items-center justify-center hover:text-accent transition-colors"
            aria-label={muted ? "Unmute" : "Mute"}
            data-ocid="video-mute-btn"
          >
            {muted ? (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={muted ? 0 : volume * 100}
            onChange={handleVolume}
            className="w-16 sm:w-20 h-1 accent-accent rounded-full cursor-pointer hidden sm:block"
            aria-label="Volume"
          />

          <button
            type="button"
            onClick={requestFullscreen}
            className="w-8 h-8 flex items-center justify-center hover:text-accent transition-colors"
            aria-label="Fullscreen"
            data-ocid="video-fullscreen-btn"
          >
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {!playing && !showControls && (
        <button
          type="button"
          onClick={() => {
            togglePlay();
            revealControls();
          }}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Play video"
        >
          <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center backdrop-blur-sm">
            <Play className="h-7 w-7 text-accent ml-1" />
          </div>
        </button>
      )}
    </div>
  );
}

// ─── AudioPlayer ──────────────────────────────────────────────────────────────

function AudioPlayer({
  url,
  mimeType,
  filename,
  compact,
  className,
}: {
  url: string;
  mimeType: string;
  filename: string;
  compact: boolean;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState(false);

  const mime = canonicalMime(mimeType, filename);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const a = audioRef.current;
    if (a?.duration) setProgress(a.currentTime / a.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const pct = Number(e.target.value) / 100;
    a.currentTime = pct * a.duration;
    setProgress(pct);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    const val = Number(e.target.value) / 100;
    setVolume(val);
    if (a) {
      a.volume = val;
      a.muted = val === 0;
    }
    setMuted(val === 0);
  };

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !a.muted;
    setMuted(a.muted);
  };

  if (error) return <LoadError url={url} filename={filename} />;

  if (compact) {
    return (
      <button
        type="button"
        className={cn(
          "relative flex items-center justify-center aspect-video bg-gradient-to-br from-accent/10 to-primary/5 rounded-lg cursor-pointer w-full",
          className,
        )}
        aria-label={playing ? "Pause audio" : "Play audio"}
        onClick={togglePlay}
        data-ocid="media-audio-compact"
      >
        {/* biome-ignore lint/a11y/useMediaCaption: captions not available for user-uploaded content */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={(e) =>
            setDuration((e.target as HTMLAudioElement).duration)
          }
          onEnded={() => setPlaying(false)}
          onError={() => setError(true)}
          preload="metadata"
        >
          <source src={url} type={mime || undefined} />
        </audio>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-end gap-0.5 h-8">
            {COMPACT_BARS.map((h, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static decorative array, no reordering
                key={`cb-${i}`}
                className={cn(
                  "w-1 rounded-full transition-all duration-150",
                  playing ? "bg-accent animate-pulse" : "bg-accent/40",
                )}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
          <div className="w-8 h-8 rounded-full bg-accent/90 flex items-center justify-center">
            {playing ? (
              <Pause className="h-3.5 w-3.5 text-accent-foreground" />
            ) : (
              <Play className="h-3.5 w-3.5 text-accent-foreground ml-0.5" />
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl px-4 py-5 space-y-4",
        className,
      )}
      data-ocid="media-audio-full"
    >
      {/* biome-ignore lint/a11y/useMediaCaption: captions not available for user-uploaded content */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) =>
          setDuration((e.target as HTMLAudioElement).duration)
        }
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setError(true)}
        preload="metadata"
      >
        <source src={url} type={mime || undefined} />
      </audio>

      {/* Waveform visualization */}
      <div className="flex items-end gap-px h-12 justify-center px-2">
        {FULL_BARS.map((h, i) => {
          const filled = i / FULL_BARS.length <= progress;
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static decorative array, no reordering
              key={`wv-${i}`}
              className={cn(
                "flex-1 rounded-full transition-colors duration-100",
                filled ? "bg-accent" : "bg-accent/20",
                playing && filled && "animate-pulse",
              )}
              style={{ height: `${h}px` }}
            />
          );
        })}
      </div>

      {/* Filename */}
      <p className="text-sm font-medium text-foreground text-center truncate">
        <Music className="h-3.5 w-3.5 inline mr-1.5 text-accent" />
        {filename}
      </p>

      {/* Progress seek */}
      <input
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={progress * 100}
        onChange={handleSeek}
        className="w-full h-1.5 accent-accent rounded-full cursor-pointer"
        aria-label="Seek"
        data-ocid="audio-progress"
      />

      {/* Time */}
      <div className="flex justify-between text-xs font-mono text-muted-foreground tabular-nums">
        <span>{fmtTime(audioRef.current?.currentTime ?? 0)}</span>
        <span>{fmtTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMute}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label={muted ? "Unmute" : "Mute"}
          data-ocid="audio-mute-btn"
        >
          {muted ? (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={muted ? 0 : volume * 100}
          onChange={handleVolume}
          className="w-20 h-1 accent-accent rounded-full cursor-pointer"
          aria-label="Volume"
        />
        <div className="flex-1 flex justify-center">
          <button
            type="button"
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-accent/20 hover:bg-accent/40 border border-accent/30 flex items-center justify-center transition-colors"
            aria-label={playing ? "Pause" : "Play"}
            data-ocid="audio-play-btn"
          >
            {playing ? (
              <Pause className="h-5 w-5 text-accent" />
            ) : (
              <Play className="h-5 w-5 text-accent ml-0.5" />
            )}
          </button>
        </div>
        <div className="w-9 h-9" />
        <div className="w-20" />
      </div>
    </div>
  );
}

// ─── ImageViewer ──────────────────────────────────────────────────────────────

function ImageViewer({
  url,
  filename,
  compact,
  className,
}: {
  url: string;
  filename: string;
  compact: boolean;
  className?: string;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [error, setError] = useState(false);

  if (error) return <LoadError url={url} filename={filename} />;

  if (compact) {
    return (
      <>
        <button
          type="button"
          className={cn(
            "relative w-full aspect-video rounded-lg overflow-hidden cursor-zoom-in bg-muted/20 group",
            className,
          )}
          aria-label={`View image: ${filename}`}
          onClick={() => setLightboxOpen(true)}
          data-ocid="media-image-compact"
        >
          <img
            src={url}
            alt={filename}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setError(true)}
          />
          <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ZoomIn className="h-6 w-6 text-foreground" />
          </div>
        </button>
        {lightboxOpen && (
          <LightboxModal
            url={url}
            filename={filename}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "relative w-full rounded-xl overflow-hidden cursor-zoom-in bg-muted/10 group",
          className,
        )}
        aria-label={`View full-size image: ${filename}`}
        onClick={() => setLightboxOpen(true)}
        data-ocid="media-image-full"
      >
        <img
          src={url}
          alt={filename}
          className="w-full object-contain max-h-[500px]"
          loading="lazy"
          onError={() => setError(true)}
        />
        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-colors flex items-end justify-end p-3 opacity-0 group-hover:opacity-100">
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg px-2 py-1 text-xs text-muted-foreground flex items-center gap-1">
            <ZoomIn className="h-3 w-3" />
            Click to enlarge
          </div>
        </div>
      </button>
      {lightboxOpen && (
        <LightboxModal
          url={url}
          filename={filename}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

function LightboxModal({
  url,
  filename,
  onClose,
}: {
  url: string;
  filename: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <dialog
      open
      className="fixed inset-0 z-50 w-screen h-screen max-w-none max-h-none m-0 p-0 bg-background/95 backdrop-blur-md flex items-center justify-center border-none"
      data-ocid="image-lightbox"
      aria-label={filename}
    >
      <div
        className="absolute inset-0"
        role="button"
        tabIndex={0}
        aria-label="Close lightbox"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape" || e.key === "Enter") onClose();
        }}
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card border border-border hover:border-accent/40 flex items-center justify-center transition-colors z-10"
        aria-label="Close lightbox"
      >
        <X className="h-5 w-5 text-foreground" />
      </button>
      <div className="relative z-10 max-w-[95vw] max-h-[90vh] flex flex-col items-center gap-3 pointer-events-none">
        <img
          src={url}
          alt={filename}
          className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl pointer-events-auto"
        />
        <p className="text-xs text-muted-foreground truncate max-w-[80vw]">
          {filename}
        </p>
      </div>
    </dialog>
  );
}

// ─── PdfViewer ────────────────────────────────────────────────────────────────

function PdfViewer({
  url,
  filename,
  compact,
  className,
}: {
  url: string;
  filename: string;
  compact: boolean;
  className?: string;
}) {
  const [embedError, setEmbedError] = useState(false);

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-center aspect-video bg-muted/20 rounded-lg border border-dashed border-border/50 group cursor-pointer",
          className,
        )}
        data-ocid="media-pdf-compact"
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1"
          aria-label={`Open PDF: ${filename}`}
        >
          <FileText className="h-8 w-8 text-accent/60 group-hover:text-accent transition-colors" />
          <span className="text-[10px] text-muted-foreground">PDF</span>
        </a>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col gap-3", className)}
      data-ocid="media-pdf-full"
    >
      {!embedError ? (
        <iframe
          src={url}
          title={filename}
          className="w-full rounded-xl border border-border/50"
          style={{ height: "640px" }}
          onError={() => setEmbedError(true)}
          aria-label={`PDF viewer: ${filename}`}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-muted/20 border border-border/50 px-6 py-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Inline PDF preview not supported in this browser.
          </p>
        </div>
      )}
      {/* Always show a download link for PDFs */}
      <div className="flex items-center gap-3 rounded-lg bg-muted/20 border border-border/50 px-4 py-3">
        <FileText className="h-5 w-5 text-accent flex-shrink-0" />
        <span className="flex-1 text-sm text-foreground truncate min-w-0">
          {filename}
        </span>
        <a
          href={url}
          download={filename}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 border border-accent/30 rounded-lg px-3 py-2 transition-colors min-h-[36px]"
          data-ocid="pdf-download"
          aria-label={`Download PDF: ${filename}`}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      </div>
    </div>
  );
}

// ─── FileDownload (unknown types) ─────────────────────────────────────────────

function FileDownload({
  url,
  filename,
  sizeBytes,
  compact,
  className,
}: {
  url: string;
  filename: string;
  sizeBytes: bigint;
  compact: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-center aspect-video bg-muted/20 rounded-lg border border-dashed border-border/50",
          className,
        )}
        data-ocid="media-doc-compact"
      >
        <FileText className="h-8 w-8 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 bg-muted/20 border border-border/50 rounded-xl px-4 py-4",
        className,
      )}
      data-ocid="media-doc-full"
    >
      <div className="w-12 h-12 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-center flex-shrink-0">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {filename}
        </p>
        <p className="text-xs text-muted-foreground">{fmtBytes(sizeBytes)}</p>
      </div>
      <a
        href={url}
        download={filename}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 border border-accent/30 rounded-lg px-3 py-2 transition-colors min-h-[44px] sm:min-h-[36px]"
        data-ocid="media-doc-download"
        aria-label={`Download ${filename}`}
      >
        <Download className="h-3.5 w-3.5" />
        Download
      </a>
    </div>
  );
}

// Keep backward-compat export names
export {
  VideoPlayer,
  AudioPlayer,
  ImageViewer,
  FileDownload as DocumentPreview,
  LightboxModal,
};

// ─── MediaPlayer (public API) ─────────────────────────────────────────────────

export interface MediaPlayerProps {
  fileRef: FileRef;
  url: string;
  className?: string;
  compact?: boolean;
}

export default function MediaPlayer({
  fileRef,
  url,
  className,
  compact = false,
}: MediaPlayerProps) {
  const kind = detectKind(fileRef.mimeType ?? "", fileRef.filename);

  switch (kind) {
    case "video":
      return (
        <VideoPlayer
          url={url}
          mimeType={fileRef.mimeType ?? ""}
          filename={fileRef.filename}
          compact={compact}
          className={className}
        />
      );
    case "audio":
      return (
        <AudioPlayer
          url={url}
          mimeType={fileRef.mimeType ?? ""}
          filename={fileRef.filename}
          compact={compact}
          className={className}
        />
      );
    case "image":
      return (
        <ImageViewer
          url={url}
          filename={fileRef.filename}
          compact={compact}
          className={className}
        />
      );
    case "pdf":
      return (
        <PdfViewer
          url={url}
          filename={fileRef.filename}
          compact={compact}
          className={className}
        />
      );
    default:
      return (
        <FileDownload
          url={url}
          filename={fileRef.filename}
          sizeBytes={fileRef.sizeBytes}
          compact={compact}
          className={className}
        />
      );
  }
}
