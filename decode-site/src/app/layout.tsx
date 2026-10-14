import type { Metadata, Viewport } from "next";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/newsreader/wght-italic.css";
import "@fontsource-variable/manrope";
import "@fontsource/jetbrains-mono/400.css";
import "./globals.css";
import { SITE } from "@/content/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd, { personLd, websiteLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: "%s | Sameer Goel" },
  description: SITE.description,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    siteName: SITE.name,
    url: SITE.url,
    title: SITE.title,
    description: SITE.description,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Sameer Goel: Build what matters. Grow who builds it." }],
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description, images: ["/og.jpg"] },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
};

export const viewport: Viewport = { themeColor: "#101820", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip">Skip to content</a>
        <JsonLd data={[personLd, websiteLd]} />
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
