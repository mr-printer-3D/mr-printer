import { Nunito, Pacifico } from "next/font/google";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-listing",
  display: "swap",
});

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-listing-script",
  display: "swap",
});

export default function ListingImagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${nunito.variable} ${pacifico.variable} ${nunito.className}`}>
      <style>{`
        :root {
          --listing-font: var(--font-listing), "Nunito", system-ui, sans-serif;
          --listing-script: var(--font-listing-script), "Pacifico", cursive;
        }
      `}</style>
      {children}
    </div>
  );
}
