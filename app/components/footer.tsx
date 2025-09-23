import { motion, useAnimationControls } from "framer-motion";
import { Github } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

export type FooterBadgeProps = {
  repoUrl: string;
  text?: string;
  className?: string;
} & ComponentPropsWithoutRef<"div">;

export const FooterBadge = ({
  repoUrl,
  text = "made with ♥ in 030",
  className = "",
  ...divProps
}: FooterBadgeProps) => {
  const controls = useAnimationControls();

  const handleJiggle = () => {
    // [AI] playful jiggle keyframes on click/tap
    controls.start({
      rotate: [0, -8, 8, -6, 6, -3, 3, -1.5, 1.5, 0],
      transition: { duration: 0.55, ease: "easeInOut" },
    });
  };

  const containerClasses = [
    "inline-flex items-center gap-1",
    "h-[32px] px-2 pr-3",
    "rounded-[20px]",
    "bg-zinc-300/90 text-black",
    "shadow-sm",
    "backdrop-blur-[2px]",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <motion.div
      className={containerClasses}
      role="contentinfo"
      animate={controls}
      initial={false}
    >
      <motion.a
        href={repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.12, rotate: 5 }}
        whileTap={{ scale: 0.94 }}
        onTap={handleJiggle}
        onClick={handleJiggle}
        className="grid place-items-center w-[18px] h-[18px] rounded-full text-black/70 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
        aria-label="Open GitHub repository"
        title="GitHub"
      >
        <Github className="h-[14px] w-[14px]" aria-hidden="true" />
      </motion.a>
      <span className="text-black text-xs font-medium leading-[12px] tracking-tight select-none">
        {text}
      </span>
    </motion.div>
  );
};
