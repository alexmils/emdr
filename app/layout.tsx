import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import {
  BRAND_DESCRIPTION,
  BRAND_LEGAL,
  BRAND_SPOKEN,
  BRAND_TITLE,
  brandMetadataBase,
} from "@/lib/brand";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
});

export const metadata: Metadata = {
  metadataBase: brandMetadataBase(),
  title: {
    default: BRAND_TITLE,
    template: `%s — ${BRAND_SPOKEN}`,
  },
  description: BRAND_DESCRIPTION,
  openGraph: {
    title: BRAND_TITLE,
    description: BRAND_DESCRIPTION,
    siteName: BRAND_LEGAL,
    type: "website",
    images: [{ url: "/brand/lockup.svg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
