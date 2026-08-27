import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

import { restaurant, SITE_URL } from "@/lib/restaurant";

// Deux graisses d’Inter et une seule de Fraunces : les axes optiques de
// Fraunces font passer le fichier de ~25 ko à plus de 110 ko, ce qui retardait
// le premier rendu du titre. Le dessin retenu est identique à l’œil.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal"],
  variable: "--font-fraunces",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Le Révélant — Salades composées à Paris 17",
    template: "%s · Le Révélant",
  },
  description: restaurant.description,
  keywords: [
    "salade Paris 17",
    "déjeuner Paris 17",
    "salade composée Paris",
    "bar à salade Paris",
    "restaurant rue Guillaume Tell",
    "click and collect déjeuner Paris",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Le Révélant",
    title: "Le Révélant — Le déjeuner frais et gourmand à Paris",
    description: restaurant.description,
    images: [
      { url: "/img/hero.jpg", width: 1200, height: 630, alt: "Salade composée Le Révélant" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Le Révélant — Salades composées à Paris 17",
    description: restaurant.description,
    images: ["/img/hero.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fbf9f4",
  colorScheme: "light",
};

/**
 * Racine : polices, langue, métadonnées. Rien de visuel — chaque univers
 * (site public, back-office) pose son propre habillage.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
