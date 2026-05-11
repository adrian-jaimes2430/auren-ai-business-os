import aurenLogo from "@/assets/auren-ai-logo.png";
import aurenMark from "@/assets/auren-ai-mark.png";

export function AurenLogo({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <img
      src={compact ? aurenMark : aurenLogo}
      alt="AUREN AI"
      className={`block h-auto object-contain ${compact ? "w-8" : "w-32"} ${className}`}
      loading="eager"
    />
  );
}
