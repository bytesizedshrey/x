"use client";

import {
  LayoutGroup,
  motion,
  useReducedMotion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  AnimatePresence,
  type Transition,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ExpandableActionBarSize = "sm" | "md";

export type ExpandableActionBarItem = {
  id: string;
  label: ReactNode;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  badge?: ReactNode;
  shortcut?: ReactNode;
};

export type ExpandableActionBarClassNames = {
  root?: string;
  track?: string;
  item?: string;
  activeItem?: string;
  icon?: string;
  label?: string;
  badge?: string;
  shortcut?: string;
};

export interface ExpandableActionBarProps {
  items: ExpandableActionBarItem[];
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  activeId?: string;
  onAction?: (item: ExpandableActionBarItem) => void;
  size?: ExpandableActionBarSize;
  expandOnHover?: boolean;
  expandOnFocus?: boolean;
  collapseDelay?: number;
  className?: string;
  classNames?: ExpandableActionBarClassNames;
  renderItem?: (
    item: ExpandableActionBarItem,
    state: { expanded: boolean; active: boolean },
  ) => ReactNode;
}

// Viscous spring for organic liquid stretching
const LIQUID_SPRING: Transition = {
  type: "spring",
  stiffness: 90,
  damping: 15,
  mass: 1.2,
};

const LABEL_TRANSITION: Transition = {
  type: "spring",
  stiffness: 110,
  damping: 16,
  mass: 1.0,
};

const SIZE_CLASS: Record<ExpandableActionBarSize, string> = {
  sm: "min-h-12 gap-1.5 p-1.5 text-xs",
  md: "min-h-16 gap-2 p-2 text-sm", // Generous spacing for premium feel
};

const ITEM_SIZE_CLASS: Record<ExpandableActionBarSize, string> = {
  sm: "h-9 min-w-[3rem] px-3",
  md: "h-12 min-w-[3.5rem] px-4", // Elongated pill shape natively
};

const ICON_SIZE_CLASS: Record<ExpandableActionBarSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
};

function useControllableExpanded({
  expanded,
  defaultExpanded,
  onExpandedChange,
}: {
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}) {
  const [internalExpanded, setInternalExpanded] = useState(
    defaultExpanded ?? false,
  );

  const isControlled = expanded !== undefined;
  const value = expanded ?? internalExpanded;

  const setValue = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalExpanded(next);
      onExpandedChange?.(next);
    },
    [isControlled, onExpandedChange],
  );

  return [value, setValue] as const;
}

export function ExpandableActionBar({
  items,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  activeId,
  onAction,
  size = "md",
  expandOnHover = true,
  expandOnFocus = true,
  collapseDelay = 250,
  className,
  classNames,
  renderItem,
}: ExpandableActionBarProps) {
  const reduce = useReducedMotion();
  const layoutId = useId();

  const [isExpanded, setIsExpanded] = useControllableExpanded({
    expanded,
    defaultExpanded,
    onExpandedChange,
  });

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const collapseTimer = useRef<number | null>(null);

  // Liquid lighting tracking
  const containerMouseX = useMotionValue(-1000);
  const containerMouseY = useMotionValue(-1000);
  const spotlightX = useSpring(containerMouseX, { stiffness: 60, damping: 20 });
  const spotlightY = useSpring(containerMouseY, { stiffness: 60, damping: 20 });
  const spotlightBackground = useMotionTemplate`radial-gradient(180px circle at ${spotlightX}px ${spotlightY}px, rgba(255,255,255,0.15), transparent 100%)`;

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current);
    collapseTimer.current = null;
  }, []);

  const open = useCallback(() => {
    clearCollapseTimer();
    setIsExpanded(true);
  }, [clearCollapseTimer, setIsExpanded]);

  const close = useCallback(() => {
    clearCollapseTimer();

    const timer = window.setTimeout(() => {
      setIsExpanded(false);
      setHoveredId(null);
    }, collapseDelay);

    collapseTimer.current = timer;
  }, [clearCollapseTimer, collapseDelay, setIsExpanded]);

  useEffect(() => clearCollapseTimer, [clearCollapseTimer]);

  const onRootMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    containerMouseX.set(e.clientX - rect.left);
    containerMouseY.set(e.clientY - rect.top);
  };

  const onRootMouseEnter = () => {
    if (expandOnHover) open();
  };

  const onRootMouseLeave = () => {
    setHoveredId(null);
    containerMouseX.set(-1000);
    containerMouseY.set(-1000);
    if (expandOnHover) close();
  };

  const onRootFocus = () => {
    if (expandOnFocus) open();
  };

  const onRootBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (
      !event.currentTarget.contains(event.relatedTarget as Node) &&
      expandOnFocus
    ) {
      close();
    }
  };

  const activeItemId = activeId ?? items.find((item) => item.active)?.id;
  const highlightId = hoveredId ?? activeItemId;

  return (
    <LayoutGroup id={layoutId}>
      {/* Idle breathing motion container */}
      <motion.div
        animate={
          hoveredId
            ? { y: 0 }
            : {
                y: [-2, 2, -2],
              }
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
        className={cn("inline-flex relative group/bar", classNames?.root, className)}
      >
        <motion.div
          layout="size"
          onMouseEnter={onRootMouseEnter}
          onMouseLeave={onRootMouseLeave}
          onMouseMove={onRootMouseMove}
          onFocus={onRootFocus}
          onBlur={onRootBlur}
          transition={LIQUID_SPRING}
          className={cn(
            "relative inline-flex items-center rounded-[999px] overflow-hidden",
            // The capsule acts as a single continuous liquid surface
            "bg-[#111111]/50 backdrop-blur-3xl saturate-150",
            // Inner glowing reflection on the top edge, dark shadow on the bottom, deep ambient shadow
            "shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_24px_48px_-12px_rgba(0,0,0,0.9)]",
            "border border-white/10",
            SIZE_CLASS[size],
            classNames?.track,
          )}
        >
          {/* Dynamic liquid spotlight trail following cursor */}
          <motion.div
            className="absolute inset-0 pointer-events-none -z-10 mix-blend-screen"
            style={{ background: spotlightBackground }}
          />

          {/* Moving reflective sheen across the whole capsule */}
          <motion.div
            className="absolute inset-0 pointer-events-none -z-10 rounded-[999px] mix-blend-overlay"
            style={{
              background:
                "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.02) 20%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.02) 60%, transparent 100%)",
              backgroundSize: "250% 100%",
            }}
            animate={{
              backgroundPosition: ["250% 0", "-250% 0"],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <AnimatePresence mode="popLayout">
            {items.map((item) => {
              const isActive = item.active || activeId === item.id;
              const isHighlighted = highlightId === item.id;

              return (
                <motion.button
                  key={item.id}
                  layout="position"
                  type="button"
                  disabled={item.disabled}
                  title={typeof item.label === "string" ? item.label : undefined}
                  onMouseEnter={() => {
                    clearCollapseTimer();
                    setHoveredId(item.id);
                  }}
                  onClick={(event: MouseEvent<HTMLButtonElement>) => {
                    event.currentTarget.blur();
                    item.onClick?.();
                    onAction?.(item);
                  }}
                  whileTap={reduce || item.disabled ? undefined : { scale: 0.92 }}
                  transition={LIQUID_SPRING}
                  className={cn(
                    "relative isolate flex items-center justify-center outline-none transition-all duration-500 ease-out",
                    "focus-visible:text-white disabled:pointer-events-none disabled:opacity-40",
                    "rounded-[99px]",
                    ITEM_SIZE_CLASS[size],
                    classNames?.item,
                    isActive && classNames?.activeItem,
                  )}
                >
                  {/* Soft morphing blob highlight that shifts seamlessly beneath icons */}
                  {isHighlighted ? (
                    <motion.div
                      layoutId="action-bar-active-blob"
                      transition={LIQUID_SPRING}
                      className="absolute inset-0 -z-10 rounded-[99px]"
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        backdropFilter: "brightness(1.15) contrast(1.1)",
                        boxShadow:
                          "0 4px 16px rgba(0,0,0,0.3), inset 0px 2px 4px rgba(255,255,255,0.15), inset 0px -2px 4px rgba(0,0,0,0.2)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    />
                  ) : null}

                  {/* Soft radial emergence for the blob */}
                  {isHighlighted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 pointer-events-none -z-10 rounded-[99px]"
                      style={{
                        background:
                          "radial-gradient(circle at center, rgba(255,255,255,0.12) 0%, transparent 60%)",
                      }}
                    />
                  )}

                  {renderItem ? (
                    renderItem(item, {
                      expanded: isExpanded,
                      active: isActive,
                    })
                  ) : (
                    <>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center justify-center transition-all duration-500 ease-out",
                          isHighlighted
                            ? "text-white scale-110 drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                            : "text-white/40 scale-100",
                          ICON_SIZE_CLASS[size],
                          classNames?.icon,
                        )}
                      >
                        {item.icon}
                      </span>

                      <motion.span
                        aria-hidden={!isExpanded}
                        animate={{
                          width: isExpanded ? "auto" : 0,
                          opacity: isExpanded ? 1 : 0,
                          marginLeft: isExpanded ? 12 : 0,
                          filter: isExpanded ? "blur(0px)" : "blur(4px)",
                        }}
                        transition={LABEL_TRANSITION}
                        className={cn(
                          "inline-block overflow-hidden whitespace-nowrap font-medium tracking-wide text-white/95",
                          classNames?.label,
                        )}
                      >
                        {item.label}
                      </motion.span>

                      {item.shortcut ? (
                        <motion.span
                          aria-hidden={!isExpanded}
                          animate={{
                            width: isExpanded ? "auto" : 0,
                            opacity: isExpanded ? 1 : 0,
                            marginLeft: isExpanded ? 8 : 0,
                          }}
                          transition={LABEL_TRANSITION}
                          className={cn(
                            "hidden overflow-hidden whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-white/30 sm:inline-block",
                            classNames?.shortcut,
                          )}
                        >
                          {item.shortcut}
                        </motion.span>
                      ) : null}

                      <AnimatePresence>
                        {item.badge && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className={cn(
                              "ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 border border-white/30 px-1 text-[9px] font-bold leading-none text-white backdrop-blur-xl shadow-[0_4px_12px_rgba(0,0,0,0.8)]",
                              !isExpanded && "absolute right-0.5 top-0.5",
                              classNames?.badge,
                            )}
                          >
                            {item.badge}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </LayoutGroup>
  );
}

export function useExpandableActionBar(items: ExpandableActionBarItem[]) {
  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState(items[0]?.id);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId),
    [activeId, items],
  );

  return useMemo(
    () => ({
      expanded,
      setExpanded,
      activeId,
      setActiveId,
      activeItem,
    }),
    [activeId, activeItem, expanded],
  );
}
