import type { Metadata } from "next";

import { LegalPageLayout } from "@/components/layout/legal-page-layout";
import { TERM_DOCUMENT } from "@/constants/legal-documents";

export const metadata: Metadata = {
  title: TERM_DOCUMENT.title,
};

export default function Page() {
  return (
    <LegalPageLayout
      content={TERM_DOCUMENT.content}
      title={TERM_DOCUMENT.title}
      updatedAt={TERM_DOCUMENT.updatedAt}
    />
  );
}
