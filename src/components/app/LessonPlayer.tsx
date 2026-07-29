import { useCallback, useEffect, useRef, useState } from "react";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

type Props = {
  src: string;
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  startAt?: number;
  onTimeUpdate?: () => void;
  onEnded?: () => void;
};

export function LessonPlayer({ src, videoRef, startAt = 0, onTimeUpdate, onEnded }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setControlsVisible(false);
    }, 2600);
  }, [videoRef]);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
    revealControls();
  }, [revealControls, videoRef]);

  const seekBy = useCallback(
    (delta: number) => {
      const el = videoRef.current;
      if (!el) return;
      el.currentTime = Math.min(Math.max(0, el.currentTime + delta), el.duration || 0);
      revealControls();
    },
    [revealControls, videoRef],
  );

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void wrapperRef.current?.requestFullscreen();
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const el = videoRef.current;
    if (!el) return;
    switch (event.key) {
      case " ":
      case "k":
        event.preventDefault();
        togglePlay();
        break;
      case "ArrowRight":
        event.preventDefault();
        seekBy(10);
        break;
      case "ArrowLeft":
        event.preventDefault();
        seekBy(-10);
        break;
      case "ArrowUp": {
        event.preventDefault();
        const up = Math.min(1, el.volume + 0.1);
        el.volume = up;
        setVolume(up);
        break;
      }
      case "ArrowDown": {
        event.preventDefault();
        const down = Math.max(0, el.volume - 0.1);
        el.volume = down;
        setVolume(down);
        break;
      }
      case "m":
        event.preventDefault();
        el.muted = !el.muted;
        setMuted(el.muted);
        break;
      case "f":
        event.preventDefault();
        toggleFullscreen();
        break;
      default:
        break;
    }
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseMove={revealControls}
      onMouseLeave={() => playing && setControlsVisible(false)}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-[oklch(0.16_0.02_260)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        onClick={togglePlay}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          setDuration(el.duration || 0);
          if (startAt > 0 && startAt < el.duration - 5) el.currentTime = startAt;
        }}
        onTimeUpdate={(e) => {
          setCurrent(e.currentTarget.currentTime);
          onTimeUpdate?.();
        }}
        onProgress={(e) => {
          const el = e.currentTarget;
          if (el.buffered.length) setBuffered(el.buffered.end(el.buffered.length - 1));
        }}
        onPlay={() => {
          setPlaying(true);
          revealControls();
        }}
        onPause={() => {
          setPlaying(false);
          setControlsVisible(true);
        }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onEnded={() => {
          setPlaying(false);
          setControlsVisible(true);
          onEnded?.();
        }}
        className="size-full cursor-pointer object-contain"
      />

      {waiting ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Loader2 className="size-9 animate-spin text-primary-foreground/80" />
        </div>
      ) : !playing ? (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play lesson"
          className="absolute inset-0 grid place-items-center bg-[oklch(0.16_0.02_260)]/35 transition-colors hover:bg-[oklch(0.16_0.02_260)]/25"
        >
          <span className="grid size-16 place-items-center rounded-2xl border border-primary-foreground/25 bg-accent/90 text-accent-foreground shadow-lg backdrop-blur transition-transform duration-200 hover:scale-105">
            <Play className="ml-0.5 size-7 fill-current" />
          </span>
        </button>
      ) : null}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-[oklch(0.14_0.02_260)] via-[oklch(0.14_0.02_260)]/70 to-transparent px-4 pb-3 pt-10 transition-all duration-300",
          controlsVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        {/* Scrubber */}
        <div className="relative h-1.5 w-full">
          <div className="absolute inset-0 rounded-sm bg-primary-foreground/20" />
          <div
            className="absolute inset-y-0 left-0 rounded-sm bg-primary-foreground/30"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-sm bg-accent"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            aria-label="Seek"
            onChange={(e) => {
              const el = videoRef.current;
              if (!el) return;
              el.currentTime = Number(e.target.value);
              setCurrent(Number(e.target.value));
            }}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
          />
          <span
            className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-accent opacity-0 transition-opacity group-hover:opacity-100"
            style={{ left: `${progress}%` }}
          />
        </div>

        <div className="mt-2.5 flex items-center gap-1 text-primary-foreground">
          <ControlButton onClick={togglePlay} label={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
          </ControlButton>
          <ControlButton onClick={() => seekBy(-10)} label="Back 10 seconds">
            <RotateCcw className="size-[18px]" />
          </ControlButton>
          <ControlButton onClick={() => seekBy(10)} label="Forward 10 seconds">
            <RotateCw className="size-[18px]" />
          </ControlButton>

          <div className="group/vol ml-1 flex items-center gap-2">
            <ControlButton
              label={muted || volume === 0 ? "Unmute" : "Mute"}
              onClick={() => {
                const el = videoRef.current;
                if (!el) return;
                el.muted = !el.muted;
                setMuted(el.muted);
              }}
            >
              {muted || volume === 0 ? <VolumeX className="size-[18px]" /> : <Volume2 className="size-[18px]" />}
            </ControlButton>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              aria-label="Volume"
              onChange={(e) => {
                const el = videoRef.current;
                if (!el) return;
                const next = Number(e.target.value);
                el.volume = next;
                el.muted = next === 0;
                setVolume(next);
                setMuted(next === 0);
              }}
              className="h-1 w-0 cursor-pointer appearance-none rounded-sm bg-primary-foreground/30 opacity-0 transition-all duration-200 group-hover/vol:w-20 group-hover/vol:opacity-100 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-primary-foreground"
            />
          </div>

          <span className="ml-2 font-mono text-xs tabular-nums text-primary-foreground/80">
            {formatTime(current)} <span className="text-primary-foreground/40">/</span> {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
                if (videoRef.current) videoRef.current.playbackRate = next;
                setSpeed(next);
              }}
              className="rounded-md px-2 py-1 font-mono text-xs font-semibold text-primary-foreground/90 transition-colors hover:bg-primary-foreground/15"
            >
              {speed}x
            </button>
            <ControlButton onClick={toggleFullscreen} label="Fullscreen">
              {fullscreen ? <Minimize className="size-[18px]" /> : <Maximize className="size-[18px]" />}
            </ControlButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-md text-primary-foreground/90 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
    >
      {children}
    </button>
  );
}
