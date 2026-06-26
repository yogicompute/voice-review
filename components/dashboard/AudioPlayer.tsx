"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  url: string;
  duration?: number;
  className?: string;
}

export function AudioPlayer({ url, duration = 0, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(duration);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrent(audio.currentTime);
    const onLoad = () => setTotal(audio.duration);
    const onEnd  = () => { setPlaying(false); setCurrent(0); };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoad);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoad);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else         { audio.play(); setPlaying(true); }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrent(Number(e.target.value));
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-3 rounded-lg border bg-secondary px-3 py-2", className)}>
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Play/pause */}
      <button
        onClick={togglePlay}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {playing
          ? <Pause size={13} />
          : <Play  size={13} className="ml-0.5" />
        }
      </button>

      {/* Progress */}
      <div className="flex-1 space-y-1">
        <div className="relative h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={total || 1}
            step={0.1}
            value={current}
            onChange={seek}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground/70 tabular-nums">
          <span>{fmt(current)}</span>
          <span>{fmt(total)}</span>
        </div>
      </div>

      <Volume2 size={14} className="text-muted-foreground/70 shrink-0" />
    </div>
  );
}