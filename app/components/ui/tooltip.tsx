import * as React from "react";
import { cn } from "~/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ children, content, side = "top", className }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);
    const handleClick = () => setIsVisible((v) => !v);

    const sideClasses =
      side === "top"
        ? "bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2"
        : side === "bottom"
          ? "top-[calc(100%+8px)] left-1/2 -translate-x-1/2"
          : side === "left"
            ? "right-[calc(100%+8px)] top-1/2 -translate-y-1/2"
            : "left-[calc(100%+8px)] top-1/2 -translate-y-1/2"; // right

    const arrowSideClasses =
      side === "top"
        ? "-bottom-1 left-1/2 -translate-x-1/2 border-t-0 border-l-0"
        : side === "bottom"
          ? "-top-1 left-1/2 -translate-x-1/2 border-b-0 border-r-0"
          : side === "left"
            ? "-right-1 top-1/2 -translate-y-1/2 border-t-0 border-l-0"
            : "-left-1 top-1/2 -translate-y-1/2 border-b-0 border-r-0"; // right

    return (
      <div
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
        {isVisible && (
          <div
            ref={ref}
            className={cn(
              "absolute z-50 select-none pointer-events-none",
              sideClasses,
              // Match homepage glassmorphism styling
              "backdrop-blur-[10px] rounded-2xl px-4 py-2 shadow-2xl",
              "text-white/90 text-sm font-medium tracking-wide",
              // Pop-in (no slide): fade + scale
              "origin-center will-change-transform will-change-opacity",
              "animate-in fade-in-0 zoom-in-95 duration-150 ease-out",
              "border border-white/20",
              className,
            )}
            style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
          >
            {content}
            <div
              className={cn(
                "absolute w-2 h-2 rotate-45",
                "backdrop-blur-[10px] border border-white/20",
                arrowSideClasses,
              )}
              style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
            />
          </div>
        )}
      </div>
    );
  },
);

Tooltip.displayName = "Tooltip";

export { Tooltip };
