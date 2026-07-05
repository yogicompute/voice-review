"use client";

import { useEffect, useState } from "react";
import { Mic } from "lucide-react";

// ── Party mode ─────────────────────────────────────────────────────────
// Kicks in 3 seconds into a recording: emojis float up around the customer
// while they keep talking. Pure CSS, pointer-events-none, zero interference.
//
// Piece layouts are generated once at module load (not during render, which
// keeps the React compiler happy). The overlays only mount client-side after
// user interaction, so there is no SSR/hydration concern.
const PARTY_EMOJIS = ["🎉", "🎊", "✨", "🎈", "🥳", "🪩", "💃", "🎶"];

const PARTY_PIECES = Array.from({ length: 14 }, (_, i) => ({
  emoji: PARTY_EMOJIS[i % PARTY_EMOJIS.length],
  left: Math.random() * 100,
  delay: -(Math.random() * 4),
  duration: 3.5 + Math.random() * 2.5,
  size: 22 + Math.random() * 18,
}));

export function PartyOverlay({ show }: { show: boolean }) {
  const pieces = PARTY_PIECES;

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute bottom-[-10%]"
          style={{
            left: `${p.left}%`,
            fontSize: p.size,
            animation: `vr-float-up ${p.duration}s linear ${p.delay}s infinite`,
          }}
        >
          {p.emoji}
        </span>
      ))}
      <style>{`
        @keyframes vr-float-up {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-110vh) rotate(340deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Confetti burst ─────────────────────────────────────────────────────
// Fired once when the recording completes (paired with a phone vibration).
const CONFETTI_COLORS = ["#059669", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#ef4444", "#10b981"];

const CONFETTI_PIECES = Array.from({ length: 60 }, () => ({
  left: Math.random() * 100,
  color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  delay: Math.random() * 0.4,
  duration: 2 + Math.random() * 1.4,
  rotate: Math.random() * 360,
  width: 6 + Math.random() * 5,
  height: 10 + Math.random() * 6,
  sway: (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 40),
}));

export function ConfettiBurst({ show }: { show: boolean }) {
  const pieces = CONFETTI_PIECES;

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-[-5%] rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `vr-confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            ["--sway" as string]: `${p.sway}px`,
          }}
        />
      ))}
      <style>{`
        @keyframes vr-confetti-fall {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          25%  { transform: translate(var(--sway), 28vh) rotate(160deg); }
          50%  { transform: translate(calc(var(--sway) * -0.6), 55vh) rotate(300deg); }
          100% { transform: translate(var(--sway), 110vh) rotate(520deg); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

// ── "Powered by" mascot ────────────────────────────────────────────────
// Tap the footer credit 3 times → a tiny mascot pops up and waves.
export function PoweredByMascot({ light }: { light?: boolean }) {
  const [taps, setTaps] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(t);
  }, [visible]);

  function handleTap() {
    const next = taps + 1;
    if (next >= 3) {
      setVisible(true);
      setTaps(0);
    } else {
      setTaps(next);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleTap}
        className={`flex items-center gap-1.5 text-xs transition-colors ${
          light
            ? "text-white/60 hover:text-white/90"
            : "text-slate-500/70 hover:text-slate-600"
        }`}
      >
        <Mic size={12} /> Powered by VoiceReview
      </button>

      {visible && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
          <div
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-2xl ring-1 ring-black/5"
            style={{ animation: "vr-mascot-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="relative flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
              🎙️
              <span
                className="absolute -right-1.5 -top-1.5 origin-[70%_70%] text-base"
                style={{ animation: "vr-wave 0.7s ease-in-out infinite" }}
              >
                👋
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800">You found me!</p>
              <p className="text-xs text-slate-500">Thanks for being awesome 💚</p>
            </div>
          </div>
          <style>{`
            @keyframes vr-mascot-pop {
              0% { transform: translateY(60px) scale(0.6); opacity: 0; }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }
            @keyframes vr-wave {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(24deg); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
