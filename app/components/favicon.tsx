import { useMemo } from "react";
import { cn } from "~/lib/utils";

interface FaviconProps {
  url?: string;
  size?: number;
  className?: string;
}

export function Favicon({ url, size = 16, className }: FaviconProps) {
  const origin = useMemo(() => {
    if (!url) return null;
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.hostname}`;
    } catch {
      return null;
    }
  }, [url]);

  if (!origin) {
    return (
      <div
        className={cn("rounded-sm bg-white/30", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(origin)}&sz=${size}`;

  return (
    <img
      src={faviconUrl}
      alt="Favicon"
      width={size}
      height={size}
      className={cn("rounded-sm", className)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
