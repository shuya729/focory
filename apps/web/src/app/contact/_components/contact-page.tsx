import { ContactForm } from "@/app/contact/_components/contact-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-8 px-6 pt-8 pb-10 sm:px-8 sm:pt-12 sm:pb-16 lg:grid-cols-[23.75rem_35rem] lg:justify-center lg:gap-16 lg:px-16 lg:pt-16 lg:pb-20">
        <section className="flex flex-col items-center gap-5 text-center lg:items-start lg:gap-6 lg:text-left">
          <div className="flex flex-col gap-3">
            <h1 className="font-bold text-[1.625rem] text-foreground leading-tight tracking-normal sm:text-4xl lg:text-[2.5rem]">
              お問い合わせ
            </h1>
            <p className="max-w-[24rem] text-muted-foreground text-sm leading-[1.8] sm:text-[0.9375rem]">
              ご意見・ご要望・不具合の報告など、どんなことでも、やさしくお寄せください。
            </p>
          </div>

          <div className="hidden w-full rounded-2xl border border-border/70 bg-card p-5 lg:flex lg:flex-col lg:gap-2.5">
            <h2 className="font-semibold text-foreground text-sm">
              返信について
            </h2>
            <p className="text-muted-foreground text-sm leading-[1.7]">
              通常3〜5営業日以内にご返信いたします。内容によってはお時間をいただく場合があります。
            </p>
          </div>
        </section>

        <ContactForm />
      </main>
      <SiteFooter />
    </div>
  );
}
