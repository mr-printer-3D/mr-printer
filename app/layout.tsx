import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { BRAND } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mrprinter.in"),
  title: {
    default: `${BRAND.name} — Premium 3D Printing Studio`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  keywords: [
    "3D printing",
    "custom 3D printing",
    "corporate gifting",
    "personalized gifts",
    "name plates",
    "keychains",
    "bulk manufacturing",
    "product prototyping",
    "MR Printer",
    "premium 3D printing India",
  ],
  authors: [{ name: BRAND.name }],
  creator: BRAND.name,
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://mrprinter.in",
    siteName: BRAND.name,
    title: `${BRAND.name} — Premium 3D Printing Studio`,
    description: BRAND.description,
    images: [
      {
        url: "/images/logo.png",
        width: 1200,
        height: 630,
        alt: BRAND.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — Premium 3D Printing Studio`,
    description: BRAND.description,
    images: ["/images/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: BRAND.name,
  description: BRAND.description,
  url: "https://mrprinter.in",
  telephone: BRAND.phone,
  email: BRAND.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Baner",
    addressLocality: "Pune",
    addressRegion: "Maharashtra",
    addressCountry: "IN",
  },
  image: "https://mrprinter.in/images/logo.png",
  slogan: BRAND.tagline,
  priceRange: "$$",
  sameAs: [BRAND.instagram, BRAND.github],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <LoadingScreen />
        <SmoothScroll>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
