import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://fitcheckr.vercel.app'),
  title: "FitCheckr - AI Virtual Try-On | Try Clothes Online with AI",
  description: "Experience the future of fashion with FitCheckr's AI-powered virtual try-on. Upload your photo and see how any clothing item looks on you instantly. Free AI fashion fitting room.",
  keywords: "virtual try-on, AI fashion, online fitting room, clothing try-on, fashion AI, virtual fitting, clothes online, fashion technology, AI try-on, virtual wardrobe",
  authors: [{ name: "Itesh Tomar" }],
  creator: "iteshxt",
  publisher: "iteshxt",
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
    title: "FitCheckr - AI Virtual Try-On",
    description: "Try on clothes virtually with our advanced AI. Upload your photo and see how any clothing item looks on you instantly.",
    siteName: "FitCheckr",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FitCheckr - Virtual Try-On",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FitCheckr - AI Virtual Try-On ",
    description: "Try on clothes virtually with our advanced AI. See how any clothing item looks on you instantly.",
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
    "name": "FitCheckr",
    "description": "AI-powered virtual try-on for fashion and clothing",
    "url": "https://fitcheckr.vercel.app",
    "applicationCategory": "Fashion",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "AI Virtual Try-On",
      "Instant Photo Processing",
      "Fashion Visualization",
      "Free Online Service"
    ],
    "browserRequirements": "Requires JavaScript. Requires HTML5."
  };

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#9333ea" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
