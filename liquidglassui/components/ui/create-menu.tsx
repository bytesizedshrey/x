"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Calendar,
  Files,
  Flag,
  FolderClosed,
  NotebookPen,
  Plus,
  Trophy,
  X,
} from "lucide-react";
import {
  type ComponentType,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Spring / easing constants (preserved from reference) ─────────────────────
const SPRING_FOLDER = { type: "spring", stiffness: 320, damping: 24, mass: 0.9 } as const;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// ─── useMedia ─────────────────────────────────────────────────────────────────
function useMedia(query: string): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    setM(mql.matches);
    const fn = (e: MediaQueryListEvent) => setM(e.matches);
    mql.addEventListener("change", fn);
    return () => mql.removeEventListener("change", fn);
  }, [query]);
  return m;
}

// ─── Types / defaults (identical to reference component) ──────────────────────
type MenuItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const ITEMS: MenuItem[] = [
  { label: "Project",   icon: FolderClosed },
  { label: "Notebook",  icon: NotebookPen  },
  { label: "Notes",     icon: Files        },
  { label: "Goal",      icon: Trophy       },
  { label: "Milestone", icon: Flag         },
  { label: "Event",     icon: Calendar     },
];

export interface CreateMenuProps {
  items?: MenuItem[];
  onSelect?: (label: string) => void;
  className?: string;
}

// ─── CreateMenu ───────────────────────────────────────────────────────────────
// Interaction: verbatim from the 21st.dev reference.
// Material: Fully transparent liquid glass. No background tint at all — only
// backdrop blur creates the "glass" read. Even the reduced-transparency
// fallback avoids an opaque fill, using a hairline border + shadow instead.
export function CreateMenu({ items = ITEMS, onSelect, className }: CreateMenuProps) {
  const [open, setOpen] = useState(false);
  const reduce          = useReducedMotion();
  const reducedTransp   = useMedia("(prefers-reduced-transparency: reduce)");

  const layoutId = useId();
  const ref = useRef<HTMLDivElement>(null);

  // Keyboard + outside-click (verbatim from reference)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const morph = reduce ? { duration: 0.15 } : SPRING_FOLDER;

  // Reduced-transparency fallback: no tint, just no blur + a slightly
  // stronger border/shadow so the shape still reads without transparency.
  const isOpaque = !!reducedTransp;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }} className={className}>
      {/* ── Layout anchor — from reference ───────────────────────────── */}
      <div style={{ height: 60, width: 200, margin: 16 }} aria-hidden />

      {/* ── Positioned overlay — from reference ─────────────────────── */}
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          left: "50%",
          top: "50%",
          zIndex: 30,
          display: "grid",
          height: 360,
          width: "min(86vw, 520px)",
          transform: "translate(-50%, -50%)",
          placeItems: "center",
        }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {open ? (
            // ── Panel (open) ─────────────────────────────────────────
            <motion.div
              key="panel"
              layoutId={layoutId}
              transition={morph}
              style={{
                position: "relative",
                borderRadius: 26,
                pointerEvents: "auto",
                width: "min(86vw, 520px)",
                background: isOpaque ? "rgba(18, 18, 20, 0.85)" : "rgba(18, 18, 20, 0.25)",
                backdropFilter: isOpaque ? "none" : "blur(3px) saturate(180%) brightness(1.05)",
                WebkitBackdropFilter: isOpaque ? "none" : "blur(3px) saturate(180%) brightness(1.05)",
                border: "1px solid rgba(255, 255, 255, 0.10)",
                boxShadow: isOpaque
                  ? "0 12px 20px rgba(0, 0, 0, 0.42)"
                  : "0 16px 40px rgba(0, 0, 0, 0.24), 0 24px 64px rgba(0, 0, 0, 0.24), inset 0 0 0 1px rgba(255, 255, 255, 0.02), inset 0 1px 1px rgba(255, 255, 255, 0.08)",
                overflow: "hidden",
              }}
            >
              {/* Specular sheen — soft diagonal light catch, independent of blur support */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "inherit",
                  pointerEvents: "none",
                  background:
                    "linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 15%)",
                  boxShadow:
                    "inset 0 0 20px rgba(0, 0, 0, 0.15), inset 2px 2px 4px rgba(255, 0, 0, 0.03), inset -2px -2px 4px rgba(0, 255, 255, 0.03)",
                }}
              />
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduce ? 0 : 0.12, duration: 0.2 }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    padding: "16px 20px",
                  }}
                >
                  <span
                    className="text-white/10 font-sans"
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      letterSpacing: "0.01em",
                    }}
                  >
                    Create new
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)")
                    }
                  >
                    <X style={{ width: 18, height: 18, strokeWidth: 1.8 } as React.CSSProperties} />
                  </button>
                </div>

                {/* Item grid — same clipPath wipe as reference */}
                <motion.div
                  initial={reduce ? false : { clipPath: "inset(0 0 100% 0)" }}
                  animate={{ clipPath: "inset(0 0 0% 0)" }}
                  transition={{ delay: reduce ? 0 : 0.1, duration: 0.4, ease: EASE_OUT }}
                  style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}
                >
                  {items.map((item, i) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => { onSelect?.(item.label); setOpen(false); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "32px 16px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.6)",
                        fontWeight: 500,
                        borderRight: i % 3 !== 2 ? "1px solid rgba(255,255,255,0.08)" : undefined,
                        borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.08)" : undefined,
                        transition: "background 0.15s, color 0.15s, font-weight 0.15s, backdrop-filter 0.15s, -webkit-backdrop-filter 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(0, 0, 0, 0.5)";
                        (e.currentTarget as HTMLElement).style.color = "rgba(255, 255, 255, 1)";
                        (e.currentTarget as HTMLElement).style.fontWeight = "700";
                        (e.currentTarget as HTMLElement).style.backdropFilter = "none";
                        (e.currentTarget as HTMLElement).style.WebkitBackdropFilter = "none";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)";
                        (e.currentTarget as HTMLElement).style.fontWeight = "500";
                        (e.currentTarget as HTMLElement).style.backdropFilter = "none";
                        (e.currentTarget as HTMLElement).style.WebkitBackdropFilter = "none";
                      }}
                    >
                      {/* Stagger — same timing as reference */}
                      <motion.span
                        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85, filter: "blur(6px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        transition={{
                          delay: reduce ? 0 : 0.14 + i * 0.04,
                          type: "spring",
                          stiffness: 460,
                          damping: 30,
                        }}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <item.icon className="h-6 w-6" />
                        <span style={{ fontSize: 13, fontFamily: "inherit" }}>
                          {item.label}
                        </span>
                      </motion.span>
                    </button>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            // ── Trigger (closed) ─────────────────────────────────────
            <motion.button
              key="trigger"
              type="button"
              layoutId={layoutId}
              transition={morph}
              style={{
                borderRadius: 9999,
                overflow: "hidden",
                position: "relative",
                height: 60,
                width: 200,
                border: "1px solid rgba(255, 255, 255, 0.10)",
                padding: "12px 24px",
                margin: "16px",
                cursor: "pointer",
                display: "inline-flex",
                background: isOpaque ? "rgba(18, 18, 20, 0.85)" : "rgba(18, 18, 20, 0.25)",
                backdropFilter: isOpaque ? "none" : "blur(3px) saturate(180%) brightness(1.05)",
                WebkitBackdropFilter: isOpaque ? "none" : "blur(3px) saturate(180%) brightness(1.05)",
                pointerEvents: "auto",
                fontWeight: 550,
                color: "rgba(255, 255, 255, 0.95)",
                transition: "background 0.15s, color 0.15s, font-weight 0.15s, backdrop-filter 0.15s, -webkit-backdrop-filter 0.15s",
                boxShadow: isOpaque
                  ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                  : "0 16px 40px rgba(0, 0, 0, 0.24), 0 24px 64px rgba(0, 0, 0, 0.24), inset 0 0 0 1px rgba(255, 255, 255, 0.02), inset 0 1px 1px rgba(255, 255, 255, 0.08)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(0, 0, 0, 0.5)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255, 255, 255, 1)";
                (e.currentTarget as HTMLElement).style.fontWeight = "700";
                (e.currentTarget as HTMLElement).style.backdropFilter = "none";
                (e.currentTarget as HTMLElement).style.WebkitBackdropFilter = "none";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = isOpaque ? "rgba(18, 18, 20, 0.85)" : "rgba(18, 18, 20, 0.25)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255, 255, 255, 0.95)";
                (e.currentTarget as HTMLElement).style.fontWeight = "550";
                (e.currentTarget as HTMLElement).style.backdropFilter = isOpaque ? "none" : "blur(3px) saturate(180%) brightness(1.05)";
                (e.currentTarget as HTMLElement).style.WebkitBackdropFilter = isOpaque ? "none" : "blur(3px) saturate(180%) brightness(1.05)";
              }}
              onClick={() => setOpen(true)}
              aria-haspopup="menu"
              aria-expanded={open}
              whileTap={reduce ? undefined : { scale: 0.97 }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "inherit",
                  pointerEvents: "none",
                  background:
                    "linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 15%)",
                  boxShadow:
                    "inset 0 0 20px rgba(0, 0, 0, 0.15), inset 2px 2px 4px rgba(255, 0, 0, 0.03), inset -2px -2px 4px rgba(0, 255, 255, 0.03)",
                }}
              />
              <div
                className="font-sans"
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  width: "100%",
                  height: "100%",
                  fontSize: 16,
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                  color: "inherit",
                }}
              >
                Create new
                <Plus style={{ width: 20, height: 20, strokeWidth: 2 } as React.CSSProperties} />
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import type React from "react";