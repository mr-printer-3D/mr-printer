import type { Metadata } from "next";
import { GalleryPage } from "@/components/pages/GalleryPage";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Browse our portfolio of premium 3D printed creations — from corporate gifts to personalized keepsakes.",
};

export default function Gallery() {
  return <GalleryPage />;
}
