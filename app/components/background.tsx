import { useEffect, useRef, useState } from "react";
import { FooterBadge } from "./footer";

interface VantaEffect {
  destroy: () => void;
}

declare global {
  interface Window {
    VANTA?: {
      FOG: (options: Record<string, unknown>) => VantaEffect;
    };
  }
}

export const Background = ({ children }: { children: React.ReactNode }) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<VantaEffect | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [vantaLoaded, setVantaLoaded] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !vantaRef.current) return;

    const initVanta = () => {
      if (window.VANTA?.FOG && vantaRef.current && !vantaEffect.current) {
        vantaEffect.current = window.VANTA.FOG({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          highlightColor: 0x003cce,
          midtoneColor: 0x0a0061,
          lowlightColor: 0xacfcd9,
          baseColor: 0xa49393,
          blurFactor: 0.4,
        });

        // Trigger fade-in after a brief delay to ensure Vanta has rendered
        setTimeout(() => {
          setVantaLoaded(true);
        }, 1);
      }
    };

    if (window.VANTA?.FOG) {
      initVanta();
    } else {
      const checkVanta = setInterval(() => {
        if (window.VANTA?.FOG) {
          clearInterval(checkVanta);
          initVanta();
        }
      }, 50);

      return () => clearInterval(checkVanta);
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, [isMounted]);

  if (!isMounted) {
    return (
      <div
        className="w-full h-full grid place-items-center"
        style={{ background: "#757AA2" }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Static gradient background - always visible */}
      <div className="absolute inset-0" style={{ background: "#757AA2" }} />

      {/* Vanta background with fade-in transition */}
      <div
        ref={vantaRef}
        className={`absolute inset-0 vanta-fade-in ${vantaLoaded ? "loaded" : ""}`}
      />

      <div className="relative z-10 flex items-center justify-center h-full">
        {children}
      </div>
      
      <div className="absolute bottom-6 left-6 z-20">
        <FooterBadge repoUrl="https://github.com/flawn/ArcFolderArchiver" />
      </div>
    </div>
  );
};
