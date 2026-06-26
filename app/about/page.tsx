import type { Metadata } from "next";
import { AboutPage } from "@/components/pages/AboutPage";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about MR. Printer — a premium 3D printing studio crafting world-class custom products in India.",
};

export default function About() {
  return <AboutPage />;
}
