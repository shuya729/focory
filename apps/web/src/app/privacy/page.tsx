import type { Metadata } from "next";

import { LegalPageLayout } from "@/components/layout/legal-page-layout";
import { PRIVACY_DOCUMENT } from "@/constants/legal-documents";

export const metadata: Metadata = {
  title: PRIVACY_DOCUMENT.title,
};

export default function Page() {
  return (
    <LegalPageLayout
      content={PRIVACY_DOCUMENT.content}
      title={PRIVACY_DOCUMENT.title}
      updatedAt={PRIVACY_DOCUMENT.updatedAt}
    />
  );
}
