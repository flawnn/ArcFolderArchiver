import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import type { FolderItem } from "~/api/models/folder";
import { cn } from "~/lib/utils";

interface FolderItemProps {
  folder: FolderItem;
  onClick?: (folder: FolderItem) => void;
  className?: string;
}

const FilledFolderIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("w-5 h-5", className)}
  >
    <path
      d="M10 4H4C2.895 4 2 4.895 2 6v12c0 1.105.895 2 2 2h16c1.105 0 2-.895 2-2V8c0-1.105-.895-2-2-2h-8l-2-2Z"
      fill="currentColor"
    />
  </svg>
);

const FilledPageIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("w-5 h-5", className)}
  >
    <path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
      fill="currentColor"
    />
    <path d="M14 2v6h6" fill="currentColor" />
  </svg>
);

export function FolderItemWidget({
  folder,
  onClick,
  className,
}: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const hasChildren = folder.children && folder.children.length > 0;
  const isFolder = folder.type === "folder";

  const handleClick = () => {
    if (isFolder && hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onClick?.(folder);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setMousePosition({ x, y });
  };

  const iconColorClass = isFolder ? "text-indigo-300" : "text-sky-300";

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "w-full flex items-center gap-3 p-4 relative overflow-hidden",
          "bg-white/20 backdrop-blur-sm rounded-2xl",
          "hover:bg-white/30 transition-all duration-300",
          "text-left text-white font-medium",
          className,
        )}
      >
        {/* [AI] Glow effect overlay */}
        <div
          className={cn(
            "absolute inset-0 opacity-0 transition-opacity duration-300 rounded-2xl",
            isHovered && "opacity-25",
          )}
          style={{
            background: `radial-gradient(circle 120px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.4) 0%, transparent 70%)`,
          }}
        />

        {/* Type Icon */}
        <div className="w-5 h-5 flex-shrink-0 relative z-10">
          {isFolder ? (
            <FilledFolderIcon className={iconColorClass} />
          ) : (
            <FilledPageIcon className={iconColorClass} />
          )}
        </div>

        <span className="flex-1 text-base relative z-10">{folder.name}</span>

        {/* Chevron on the right for folders with children */}
        {isFolder && hasChildren ? (
          <div className="w-4 h-4 flex-shrink-0 ml-3 opacity-80 relative z-10">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-white/70" />
            ) : (
              <ChevronRight className="w-4 h-4 text-white/70" />
            )}
          </div>
        ) : null}
      </button>

      {/* Render children with animation if expanded */}
      <AnimatePresence initial={false}>
        {isFolder && hasChildren && isExpanded && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: 8 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn("overflow-hidden")}
          >
            <div className="space-y-2 pl-6">
              {folder.children!.map((child, index) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, delay: 0.06 * index }}
                >
                  <FolderItemWidget folder={child} onClick={onClick} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
