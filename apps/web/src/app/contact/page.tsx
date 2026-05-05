import type { Metadata } from "next";

import ContactPage from "@/app/contact/_components/contact-page";

export const metadata: Metadata = {
  title: "お問い合わせ",
};

export default function Page() {
  return <ContactPage />;
}
