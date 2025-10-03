"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/telemetry";
import { isFeatureEnabled } from "@/lib/featureFlags";

const PRIMARY = "Learn → Act → Profit";
const SECONDARY = [
  "Turning Whale Moves Into Alpha",
  "AI Copilot for Crypto Whales.",
  "Smart Whale Signals. Simple Decisions.",
];

export function HeaderMotto({
  plan = "lite",
  mode = "novice",
  device = "web",
}: { plan?: string; mode?: string; device?: "web" | "mobile" }) {
  const [text, setText] = useState(PRIMARY);
  const [rotateOn, setRotateOn] = useState(false);
  const idx = useRef(0);

  const prefersReduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
    []
  );

  useEffect(() => {
    isFeatureEnabled("lite_header_rotate_motto")
      .then(setRotateOn)
      .catch(() => setRotateOn(false));

    const theme =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";

    trackEvent("header_motto_rendered", {
      plan,
      mode,
      device,
      theme,
      locale:
        typeof navigator !== "undefined" ? navigator.language : "en-US",
      ff_motto_rotate: rotateOn,
    });
  }, [plan, mode, device, rotateOn]);

  useEffect(() => {
    if (!rotateOn || prefersReduced) return;
    const id = setInterval(() => {
      idx.current = (idx.current + 1) % SECONDARY.length;
      setText(SECONDARY[idx.current]);
    }, 8000);
    return () => clearInterval(id);
  }, [rotateOn, prefersReduced]);

  return (
    <div
      className="h-6 flex items-center overflow-hidden"
      aria-label={`App motto: ${text}`}
      title={text}
    >
      <span
        className="
          text-[15px] font-semibold bg-gradient-to-r from-[#48bcff] to-[#9b76ff]
          bg-clip-text text-transparent ml-3 whitespace-nowrap truncate
          dark:from-[#0ea5e9] dark:to-[#a78bfa]
          motion-safe:opacity-0 motion-safe:animate-[fadeIn_400ms_ease-out_forwards]
        "
      >
        {text}
      </span>
    </div>
  );
}