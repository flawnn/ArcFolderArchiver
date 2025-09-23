import type { CSSProperties, ReactNode } from "react";
import { cn } from "~/lib/utils";

interface BlurContainerProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function BlurContainer({
  children,
  className,
  style,
}: BlurContainerProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={cn(
          "backdrop-blur-[10px] rounded-3xl p-12 shadow-2xl",
          
          className,
        )}
        style={{ backgroundColor: "rgba(221, 221, 221, 0.64)", ...style }}
      >
        {children}
      </div>
    </div>
  );
}
