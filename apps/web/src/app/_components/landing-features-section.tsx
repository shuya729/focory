import {
  CalendarCheck,
  type LucideIcon,
  MessageCircleHeart,
  Timer,
} from "lucide-react";

import {
  LANDING_FEATURES,
  LANDING_FEATURES_HEADING,
  type LandingFeatureIcon,
} from "@/constants/landing";

const FEATURE_ICONS = {
  calendar: CalendarCheck,
  message: MessageCircleHeart,
  timer: Timer,
} as const satisfies Record<LandingFeatureIcon, LucideIcon>;

export default function LandingFeaturesSection() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:px-8 sm:py-16 lg:px-16 lg:py-20">
      <h2 className="wrap-anywhere mx-auto max-w-full text-center font-bold text-2xl text-foreground leading-[1.4] tracking-normal sm:text-4xl">
        {LANDING_FEATURES_HEADING}
      </h2>
      <div className="grid gap-5 md:grid-cols-3 lg:gap-6">
        {LANDING_FEATURES.map((feature) => {
          const FeatureIcon = FEATURE_ICONS[feature.icon];

          return (
            <article
              className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border/60 bg-card p-6 sm:rounded-3xl sm:p-9"
              key={feature.title}
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-brand text-foreground sm:size-14 sm:rounded-2xl">
                <FeatureIcon aria-hidden="true" className="size-6 sm:size-7" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="wrap-anywhere font-semibold text-foreground text-lg tracking-normal sm:text-xl">
                  {feature.title}
                </h3>
                <p className="wrap-anywhere text-base text-foreground/75 leading-[1.7]">
                  {feature.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
