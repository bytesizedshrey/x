"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Layers,
  MessageSquare,
  PenTool,
  Plus,
  X,
  Zap,
} from "lucide-react";

// ─── Environment background ─────────────────────────────────────────────────
// Must match body { background } in globals.css so the lens copy is spatially
// aligned with the real scene behind it.
const ENV_BG =
  "radial-gradient(ellipse 85% 95% at 26% 20%, #17243c 0%, #07090e 62%)";

// ─── Geometry ───────────────────────────────────────────────────────────────
const PANEL_W = 380;
const PANEL_H = 108;
const LENS_D = 82; // diameter
const ITEM_W = 72;
const ITEM_GAP = 6;
const ITEM_STRIDE = ITEM_W + ITEM_GAP;
// Panel center X — active item must align to this:
const PANEL_CX = PANEL_W / 2;
const ITEM_HALF = ITEM_W / 2;

// ─── Spring physics ─────────────────────────────────────────────────────────
// Deliberately NOT reused from any reference implementation.
const SPRING_FIELD = {
  type: "spring",
  stiffness: 485,
  damping: 37,
  mass: 0.44,
} as const;
const SPRING_PANEL = {
  type: "spring",
  stiffness: 390,
  damping: 42,
  mass: 0.62,
} as const;
const SPRING_ITEM = {
  type: "spring",
  stiffness: 330,
  damping: 25,
  mass: 0.52,
} as const;
const SPRING_CONFIRM = {
  type: "spring",
  stiffness: 680,
  damping: 20,
  mass: 0.22,
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────
export type PaletteItem = {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

export interface GravityLensPaletteProps {
  items?: PaletteItem[];
  onSelect?: (item: PaletteItem) => void;
  /** Initial active index when panel opens */
  defaultIndex?: number;
  className?: string;
}

// ─── Default items (unrelated to reference) ─────────────────────────────────
const DEFAULT_ITEMS: PaletteItem[] = [
  { id: "layer", label: "Layer", icon: Layers },
  { id: "signal", label: "Signal", icon: Zap },
  { id: "thread", label: "Thread", icon: MessageSquare },
  { id: "schema", label: "Schema", icon: GitBranch },
  { id: "canvas", label: "Canvas", icon: PenTool },
  { id: "archive", label: "Archive", icon: Archive },
];

// ─── Displacement map generator ──────────────────────────────────────────────
// Produces a radial map where:
//   - center: (128, 128) = no displacement
//   - body (t < 0.55): gentle inward convergence (convex body)
//   - rim (t > 0.55): strong outward divergence (total-internal-reflection zone)
// This mimics the physical optics of a thick glass lens.
function buildDisplacementMap(size: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const t = dist / r; // 0 = center, 1 = rim
      const idx = (y * size + x) * 4;

      if (t < 1.0) {
        const nx = dist > 0 ? dx / dist : 0;
        const ny = dist > 0 ? dy / dist : 0;
        const bend =
          t < 0.55
            ? -Math.pow(t / 0.55, 2.0) * 0.22 // inward (convergence)
            : Math.pow((t - 0.55) / 0.45, 2.8) * 1.7; // outward (rim refraction)
        img.data[idx + 0] = Math.min(255, Math.max(0, Math.round(128 + bend * nx * 86)));
        img.data[idx + 1] = Math.min(255, Math.max(0, Math.round(128 + bend * ny * 86)));
        img.data[idx + 2] = 128;
        img.data[idx + 3] = 255;
      } else {
        // Outside lens disk: neutral
        img.data[idx + 0] = 128;
        img.data[idx + 1] = 128;
        img.data[idx + 2] = 128;
        img.data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

// ─── useMedia ────────────────────────────────────────────────────────────────
function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const fn = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", fn);
    return () => mql.removeEventListener("change", fn);
  }, [query]);
  return matches;
}

// ─── GlassLens ───────────────────────────────────────────────────────────────
// The physical lens layer. Renders a displaced copy of the environment
// background and layered specular highlights.
//
// Architecture (per skill.md):
//   z-0: displaced background copy (feDisplacementMap on ENV_BG copy)
//   z-1: specular highlight overlay
//   z-2: structural rim / box-shadow
//   z-3: children slot (above glass — never distorted)
interface GlassLensProps {
  size: number;
  filterId: string;
  hasFilter: boolean;
  reducedTransparency: boolean;
  children?: ReactNode;
}

function GlassLens({
  size,
  filterId,
  hasFilter,
  reducedTransparency,
  children,
}: GlassLensProps) {
  // overflow: how far the bg copy extends past the lens edge to give the
  // displacement map room to work without black-border artifacts.
  const overflow = Math.round(size * 0.28);

  // ── Accessibility fallback ──
  if (reducedTransparency) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          flexShrink: 0,
          position: "relative",
          background: "rgba(48, 78, 145, 0.9)",
          boxShadow: [
            "0 0 0 1.5px rgba(255,255,255,0.28)",
            "inset 0 1px 3px rgba(255,255,255,0.22)",
            "0 8px 28px rgba(0,0,0,0.5)",
          ].join(", "),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* ── Layer 0: Displaced environment copy ─────────────────────────────
          Sized larger than the lens to prevent displacement-map edge
          artifacts. background-attachment:fixed aligns this copy with the
          real body background so the lens "looks through" to the scene.
          NOTE: background-attachment:fixed is temporarily misaligned during
          animated-opacity ancestors (AnimatePresence), which is imperceptible
          at low opacity and resolves once opacity:1 is reached. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: -overflow,
          background: ENV_BG,
          backgroundAttachment: "fixed",
          filter: hasFilter ? `url(#${filterId})` : undefined,
          willChange: "filter",
          borderRadius: "50%",
        }}
      />

      {/* ── Layer 1: Specular highlight (top-left light source) ─────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at 37% 27%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.07) 40%, transparent 58%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Layer 2: Structural rim (inset shadows + fine border) ────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.09)",
          boxShadow: [
            "inset 0 0 0 1px rgba(255,255,255,0.2)",
            "inset 0 1.5px 4px rgba(255,255,255,0.3)",
            "inset 0 -2px 7px rgba(0,0,0,0.48)",
            "0 0 0 1px rgba(0,0,0,0.58)",
            "0 10px 32px rgba(0,0,0,0.58)",
            "0 2px 8px rgba(0,0,0,0.38)",
          ].join(", "),
          pointerEvents: "none",
        }}
      />

      {/* ── Layer 3: Content (above glass — not distorted) ──────────────── */}
      {children != null && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── GravityLensPalette ───────────────────────────────────────────────────────
// Interaction paradigm: Spatial Navigation
//
// The glass lens is stationary. The item universe slides beneath it.
// Arrow keys shift the universe; whichever item lands under the lens is aimed.
// Enter/click confirms. The user navigates a space — they don't click a grid.
export function GravityLensPalette({
  items = DEFAULT_ITEMS,
  onSelect,
  defaultIndex = 0,
  className,
}: GravityLensPaletteProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const [mapUrl, setMapUrl] = useState("");
  const [confirming, setConfirming] = useState(false);

  const reducedMotion = useReducedMotion();
  const reducedTransparency = useMedia("(prefers-reduced-transparency: reduce)");

  // Stable IDs (useId is collision-safe in concurrent React)
  const rawId = useId();
  const filterId = `glp-f-${rawId.replace(/:/g, "")}`;
  const listboxId = `glp-lb-${rawId.replace(/:/g, "")}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // ── Generate displacement map once on mount ──
  useEffect(() => {
    setMapUrl(buildDisplacementMap(256));
  }, []);

  // ── Focus management ──────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => panelRef.current?.focus(), 60);
      return () => clearTimeout(t);
    } else {
      triggerRef.current?.focus();
    }
  }, [open]);

  // ── Keyboard + outside pointer ────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, items.length - 1));
          break;
        case "ArrowLeft":
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          break;
        case "Home":
          e.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          e.preventDefault();
          setActiveIndex(items.length - 1);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          handleConfirm(activeIndex);
          break;
        case "Escape":
          e.preventDefault();
          handleClose();
          break;
      }
    }

    function onPointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex, items.length]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleConfirm = useCallback(
    (index: number) => {
      if (confirming) return;
      setConfirming(true);
      onSelect?.(items[index]);
      const delay = reducedMotion ? 80 : 280;
      setTimeout(() => {
        setOpen(false);
        setActiveIndex(defaultIndex);
        setConfirming(false);
      }, delay);
    },
    [confirming, items, onSelect, defaultIndex, reducedMotion]
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setActiveIndex(defaultIndex);
  }, [defaultIndex]);

  // ── Item field offset ─────────────────────────────────────────────────────
  // Translates so that items[activeIndex] is centered under the stationary lens.
  // fieldX = panel_center_x - (activeIndex × stride) - item_half_width
  const fieldX = PANEL_CX - activeIndex * ITEM_STRIDE - ITEM_HALF;

  // ── Conditional spring configs ────────────────────────────────────────────
  const fieldSpring = reducedMotion ? { duration: 0.12 } : SPRING_FIELD;
  const panelSpring = reducedMotion ? { duration: 0.14 } : SPRING_PANEL;
  const itemSpring = reducedMotion ? { duration: 0.1 } : SPRING_ITEM;
  const confirmSpring = reducedMotion ? { duration: 0.1 } : SPRING_CONFIRM;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center", userSelect: "none" }}
    >
      {/* ── SVG Filter (always mounted, safe passthrough until map loads) ── */}
      <svg
        width={0}
        height={0}
        aria-hidden="true"
        focusable="false"
        style={{ position: "absolute", overflow: "hidden" }}
      >
        <defs>
          <filter
            id={filterId}
            x="-32%"
            y="-32%"
            width="164%"
            height="164%"
            colorInterpolationFilters="sRGB"
          >
            {mapUrl ? (
              <>
                <feImage
                  href={mapUrl}
                  result="dmap"
                  x="0%"
                  y="0%"
                  width="100%"
                  height="100%"
                  preserveAspectRatio="xMidYMid slice"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="dmap"
                  scale="27"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </>
            ) : (
              // Safe passthrough while map is loading
              <feOffset dx={0} dy={0} />
            )}
          </filter>
        </defs>
      </svg>

      {/* ── ARIA live region — screen reader navigation announcements ──── */}
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
        }}
      >
        {open ? `${items[activeIndex]?.label}, ${activeIndex + 1} of ${items.length}` : ""}
      </span>

      {/* ── AnimatePresence: Trigger ↔ Panel ─────────────────────────────── */}
      <AnimatePresence mode="wait" initial={false}>
        {!open ? (
          // ────────────────────────── CLOSED STATE ──────────────────────
          <motion.div
            key="trigger"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.86, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -6 }}
            transition={panelSpring}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
          >
            <button
              ref={triggerRef}
              type="button"
              aria-label="Open creation palette"
              aria-haspopup="listbox"
              aria-expanded={false}
              aria-controls={listboxId}
              onClick={() => setOpen(true)}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                borderRadius: "50%",
                display: "block",
                outline: "none",
              }}
            >
              <GlassLens
                size={LENS_D}
                filterId={filterId}
                hasFilter={mapUrl.length > 0}
                reducedTransparency={reducedTransparency}
              >
                <Plus
                  size={20}
                  strokeWidth={1.5}
                  style={{ color: "rgba(255,255,255,0.72)" }}
                />
              </GlassLens>
            </button>

            <span
              style={{
                fontSize: 10.5,
                color: "rgba(255,255,255,0.32)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "inherit",
              }}
            >
              Create
            </span>
          </motion.div>
        ) : (
          // ────────────────────────── OPEN STATE ────────────────────────
          <motion.div
            key="panel"
            ref={panelRef}
            id={listboxId}
            role="listbox"
            aria-label="Create new — Arrow keys to navigate, Enter to confirm"
            aria-orientation="horizontal"
            aria-activedescendant={`${filterId}-opt-${activeIndex}`}
            tabIndex={0}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
            transition={panelSpring}
            style={{
              width: PANEL_W,
              borderRadius: 24,
              background: "rgba(5, 8, 15, 0.96)",
              border: "1px solid rgba(255,255,255,0.062)",
              boxShadow: [
                "inset 0 2px 12px rgba(0,0,0,0.55)",
                "inset 0 -1px 1px rgba(255,255,255,0.025)",
                "0 24px 64px rgba(0,0,0,0.7)",
                "0 0 0 1px rgba(0,0,0,0.45)",
              ].join(", "),
              position: "relative",
              overflow: "hidden",
              outline: "none",
            }}
          >
            {/* ── Item viewport (clips the sliding field) ─────────────── */}
            <div
              style={{
                position: "relative",
                height: PANEL_H,
                overflow: "hidden",
              }}
            >
              {/* ── Sliding item field ─────────────────────────────────
                  z-index: 3 — ABOVE the glass lens (skill.md: items must
                  sit on top of the lens to avoid distortion). */}
              <motion.div
                aria-hidden="true"
                animate={{ x: fieldX }}
                transition={fieldSpring}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: ITEM_GAP,
                  zIndex: 3,
                  pointerEvents: "auto",
                }}
              >
                {items.map((item, i) => {
                  const dist = Math.abs(i - activeIndex);
                  // Opacity focus gradient: active=1.0, ±1=0.44, ±2+=0.18
                  const opacity = dist === 0 ? 1.0 : dist === 1 ? 0.44 : 0.18;
                  const scale = dist === 0 ? 1.05 : 1.0;
                  const Icon = item.icon;

                  return (
                    <motion.button
                      key={item.id}
                      id={`${filterId}-opt-${i}`}
                      type="button"
                      role="option"
                      aria-selected={i === activeIndex}
                      aria-label={item.label}
                      onClick={() => {
                        // First click on non-active: navigate. Second: confirm.
                        if (i === activeIndex) {
                          handleConfirm(i);
                        } else {
                          setActiveIndex(i);
                        }
                      }}
                      animate={{ opacity, scale }}
                      transition={itemSpring}
                      style={{
                        width: ITEM_W,
                        height: PANEL_H - 8,
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 9,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.9)",
                        padding: 0,
                        fontFamily: "inherit",
                        outline: "none",
                        tabIndex: -1,
                      } as React.CSSProperties}
                    >
                      <Icon size={18} strokeWidth={1.4} />
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 450,
                          letterSpacing: "0.025em",
                          lineHeight: 1,
                        }}
                      >
                        {item.label}
                      </span>
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* ── Glass Lens (stationary, centered) ──────────────────
                  z-index: 2 — BELOW the item field (lens refracts the
                  environment behind, items float above unaffected). */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              >
                <motion.div
                  animate={
                    confirming
                      ? { scale: [1, 1.1, 0.96, 1] }
                      : { scale: 1 }
                  }
                  transition={confirmSpring}
                >
                  <GlassLens
                    size={LENS_D}
                    filterId={filterId}
                    hasFilter={mapUrl.length > 0}
                    reducedTransparency={reducedTransparency}
                  />
                </motion.div>
              </div>

              {/* ── Edge fade masks (hides abrupt clip at panel edges) ── */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to right, rgba(5,8,15,0.97) 0%, transparent 20%, transparent 80%, rgba(5,8,15,0.97) 100%)",
                  pointerEvents: "none",
                  zIndex: 4,
                }}
              />
            </div>

            {/* ── Footer: counter / label / nav ───────────────────────── */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 14px 12px",
              }}
            >
              {/* Index counter */}
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.2)",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "0.07em",
                  fontFamily: "var(--font-geist-mono, monospace)",
                  lineHeight: 1,
                }}
              >
                {String(activeIndex + 1).padStart(2, "0")}/{items.length}
              </span>

              {/* Active item label (cross-fades on change) */}
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeIndex}
                  initial={reducedMotion ? {} : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? {} : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: 10.5,
                    color: "rgba(255,255,255,0.38)",
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  {items[activeIndex]?.label}
                </motion.span>
              </AnimatePresence>

              {/* Navigation arrows */}
              <div style={{ display: "flex", gap: 4 }}>
                {(
                  [
                    {
                      dir: "prev",
                      label: "Previous",
                      Icon: ChevronLeft,
                      disabled: activeIndex === 0,
                      onClick: () => setActiveIndex((i) => Math.max(i - 1, 0)),
                    },
                    {
                      dir: "next",
                      label: "Next",
                      Icon: ChevronRight,
                      disabled: activeIndex === items.length - 1,
                      onClick: () =>
                        setActiveIndex((i) => Math.min(i + 1, items.length - 1)),
                    },
                  ] as const
                ).map(({ dir, label, Icon, disabled, onClick }) => (
                  <button
                    key={dir}
                    type="button"
                    aria-label={`${label} item`}
                    tabIndex={-1}
                    disabled={disabled}
                    onClick={onClick}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 6,
                      width: 26,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: disabled ? "default" : "pointer",
                      color: disabled
                        ? "rgba(255,255,255,0.11)"
                        : "rgba(255,255,255,0.36)",
                      padding: 0,
                      transition: "color 0.14s, border-color 0.14s",
                    }}
                  >
                    <Icon size={11} strokeWidth={2} />
                  </button>
                ))}
              </div>
            </div>

            {/* ── Close button ─────────────────────────────────────────── */}
            <button
              type="button"
              aria-label="Close palette"
              onClick={handleClose}
              style={{
                position: "absolute",
                top: 11,
                right: 13,
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.22)",
                cursor: "pointer",
                padding: 3,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.14s",
                outline: "none",
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(255,255,255,0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(255,255,255,0.22)";
              }}
            >
              <X size={13} strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Re-export React for implicit JSX use in CSSProperties cast
import type React from "react";
