import { Hero } from "@/components/home/Hero";
import { WhyMrPrinter } from "@/components/home/WhyMrPrinter";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Industries } from "@/components/home/Industries";
import { CorporateGiftingSection } from "@/components/home/CorporateGifting";
import { Portfolio } from "@/components/home/Portfolio";
import { Process } from "@/components/home/Process";
import { Testimonials } from "@/components/home/Testimonials";
import { FAQ } from "@/components/home/FAQ";
import { CTA } from "@/components/home/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <WhyMrPrinter />
      <FeaturedProducts />
      <Industries />
      <CorporateGiftingSection />
      <Portfolio />
      <Process />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
}
