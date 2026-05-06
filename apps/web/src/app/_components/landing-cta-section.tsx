import Image from "next/image";

import { AppStoreBadge } from "@/components/elements/app-store-badge";
import { GooglePlayBadge } from "@/components/elements/google-play-badge";
import { LANDING_CTA } from "@/constants/landing";

export default function LandingCtaSection() {
  return (
    <section
      className="mx-auto max-w-7xl px-6 pt-6 pb-10 sm:px-8 sm:py-16 lg:px-16 lg:py-20"
      id="download"
    >
      <div className="flex flex-col items-center gap-5 rounded-3xl bg-brand px-6 py-10 text-center sm:gap-7 sm:rounded-[2rem] sm:px-12 sm:py-16">
        <Image
          alt=""
          aria-hidden="true"
          className="size-16 sm:size-20"
          height={80}
          src="/images/focory.png"
          width={80}
        />
        <div className="flex flex-col gap-2">
          <h2 className="wrap-anywhere font-bold text-foreground text-xl leading-[1.4] tracking-normal sm:text-3xl">
            {LANDING_CTA.title}
          </h2>
          <p className="wrap-anywhere font-medium text-base text-foreground/75 leading-[1.7] sm:text-xl">
            {LANDING_CTA.description}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center justify-center gap-3 sm:w-auto">
          <AppStoreBadge />
          <GooglePlayBadge />
        </div>
      </div>
    </section>
  );
}
