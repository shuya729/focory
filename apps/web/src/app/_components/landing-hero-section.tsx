import Image from "next/image";

import { AppStoreBadge } from "@/components/elements/app-store-badge";
import { GooglePlayBadge } from "@/components/elements/google-play-badge";
import { LANDING_HERO } from "@/constants/landing";

export default function LandingHeroSection() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-10 sm:px-8 sm:py-16 lg:grid-cols-[1fr_27.5rem] lg:gap-20 lg:px-16 lg:py-20">
      <div className="flex min-w-0 flex-col items-center gap-6 text-center lg:items-start lg:text-left">
        <h1 className="wrap-anywhere max-w-full whitespace-pre-line font-bold text-[2rem] text-foreground leading-tight tracking-normal sm:text-5xl lg:text-[3.5rem] lg:leading-[1.2]">
          {LANDING_HERO.title}
        </h1>
        <p className="wrap-anywhere w-full max-w-152 text-foreground/75 text-sm leading-[1.7] sm:text-lg">
          <span className="sm:inline">{LANDING_HERO.description}</span>
        </p>
        <div className="flex w-full flex-wrap items-center justify-center gap-3 sm:w-auto sm:py-10">
          <AppStoreBadge />
          <GooglePlayBadge />
        </div>
      </div>

      <div className="flex min-h-70 min-w-0 items-center justify-center rounded-3xl border border-border/60 bg-card p-8 sm:min-h-104 sm:p-12 lg:min-h-140 lg:rounded-[2rem]">
        <div className="flex flex-col items-center gap-5 sm:gap-6">
          <Image
            alt=""
            aria-hidden="true"
            className="size-20 sm:size-32 lg:size-35"
            height={140}
            priority
            src="/images/focory.png"
            width={140}
          />
          <div className="rounded-2xl border border-border/40 bg-background/80 px-5 py-4 text-center text-foreground text-sm leading-[1.7] sm:px-6 sm:py-5 sm:text-[0.9375rem]">
            <p className="whitespace-pre-line">{LANDING_HERO.visualMessage}</p>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {LANDING_HERO.visualCaption}
          </p>
        </div>
      </div>
    </section>
  );
}
