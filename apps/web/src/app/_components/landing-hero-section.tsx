import Image from "next/image";

import { AppStoreBadge } from "@/components/elements/app-store-badge";
import { GooglePlayBadge } from "@/components/elements/google-play-badge";
import { LANDING_HERO } from "@/constants/landing";

export default function LandingHeroSection() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-10 sm:px-8 sm:py-16 lg:grid-cols-[1fr_27.5rem] lg:gap-20 lg:px-16 lg:py-20">
      <div className="flex min-w-0 flex-col items-center gap-6 text-center lg:items-start lg:text-left">
        <h1 className="max-w-full whitespace-pre-line font-bold text-[2rem] text-foreground leading-[1.25] tracking-normal [overflow-wrap:anywhere] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.2]">
          {LANDING_HERO.title}
        </h1>
        <p className="w-full max-w-[38rem] text-muted-foreground text-sm leading-[1.7] [overflow-wrap:anywhere] sm:text-lg">
          <span className="hidden sm:inline">{LANDING_HERO.description}</span>
          <span className="sm:hidden">{LANDING_HERO.mobileDescription}</span>
        </p>
        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <AppStoreBadge className="w-[11.25rem]" />
          <GooglePlayBadge className="w-[11.25rem]" />
        </div>
      </div>

      <div className="flex min-h-[17.5rem] min-w-0 items-center justify-center rounded-3xl border border-border/60 bg-card p-8 sm:min-h-[26rem] sm:p-12 lg:min-h-[35rem] lg:rounded-[2rem]">
        <div className="flex flex-col items-center gap-5 sm:gap-6">
          <Image
            alt=""
            aria-hidden="true"
            className="size-20 sm:size-32 lg:size-[8.75rem]"
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
