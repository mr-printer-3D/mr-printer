import type { Metadata } from "next";
import { CorporateGiftingPage } from "@/components/pages/CorporateGiftingPage";

export const metadata: Metadata = {
  title: "Corporate Gifting",
  description:
    "Luxury corporate gifting solutions with custom 3D printed merchandise, premium packaging, and bulk order discounts.",
};

export default function CorporateGifting() {
  return <CorporateGiftingPage />;
}
