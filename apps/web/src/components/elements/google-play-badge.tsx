import { Play } from "lucide-react";

import { SITE } from "@/constants/site";
import { cn } from "@/utils/cn";

interface GooglePlayBadgeProps {
  className?: string;
  href?: string;
}

export function GooglePlayBadge({
  className,
  href = SITE.googlePlayHref,
}: GooglePlayBadgeProps) {
  return (
    <a
      aria-label="Google Play で Focory を入手"
      className={cn(
        "inline-flex h-14 w-[11.25rem] items-center gap-2.5 rounded-xl bg-foreground px-4 py-2.5 text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
      href={href}
    >
      <Play aria-hidden="true" className="size-7 shrink-0 fill-current" />
      <span className="flex flex-col leading-none">
        <span className="text-[0.625rem] opacity-85">GET IT ON</span>
        <span className="font-semibold text-lg">Google Play</span>
      </span>
    </a>
  );
}
