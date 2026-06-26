import type { Metadata } from "next";
import { ContactPage } from "@/components/pages/ContactPage";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with MR. Printer for custom 3D printing quotes, corporate gifting inquiries, and bulk orders.",
};

export default function Contact() {
  return <ContactPage />;
}
