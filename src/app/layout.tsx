import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "./client-layout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://fitcheckr.vercel.app'),
  title: "FitCheckr - Virtual Fitting Room | AI Try-On Experience",
  description: "Step into your personal virtual dressing room. Try on any outfit instantly with AI - mix and match clothes like you're at your favorite boutique, from anywhere.",
  keywords: "virtual fitting room, AI try-on, online dressing room, virtual wardrobe, clothing try-on, fashion AI, mix and match clothes, virtual boutique, fashion technology",
  authors: [{ name: "Itesh Tomar" }],
  creator: "iteshxt",
  publisher: "iteshxt",
  icons: {
    icon: { url: '/favicon.svg', type: 'image/svg+xml' },
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://fitcheckr.vercel.app",
    title: "FitCheckr - Your Virtual Fitting Room",
    description: "Try on any outfit instantly with AI. Mix and match clothes like you're at your favorite boutique - from anywhere.",
    siteName: "FitCheckr - Virtual Fitting Room",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FitCheckr - Virtual Fitting Room",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FitCheckr - Virtual Fitting Room",
    description: "Try on any outfit instantly with AI. Your personal dressing room, anywhere.",
    images: ["/og-image.png"],
    creator: "@iteshxt",
  },
  alternates: {
    canonical: "https://fitcheckr.vercel.app",
  },
  category: "Fashion Technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "FitCheckr - Virtual Fitting Room",
    "description": "Your personal virtual dressing room. Try on any outfit with AI - mix and match clothes like at your favorite boutique.",
    "url": "https://fitcheckr.vercel.app",
    "applicationCategory": "Fashion",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Virtual Fitting Room",
      "AI Outfit Try-On",
      "Mix & Match Clothes",
      "Instant Results",
      "Free Online Service"
    ],
    "browserRequirements": "Requires JavaScript. Requires HTML5."
  };

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#722F37" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://vercel.app" />
        
        {/* DNS prefetch for potential external resources */}
        <link rel="dns-prefetch" href="//fitcheckr.vercel.app" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
