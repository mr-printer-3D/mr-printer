import type { Metadata } from "next";
import { ProductsPage } from "@/components/pages/ProductsPage";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Explore our premium 3D printed products — keychains, name plates, corporate gifts, desk accessories, miniatures, and personalized gifts.",
};

export default function Products() {
  return <ProductsPage />;
}
