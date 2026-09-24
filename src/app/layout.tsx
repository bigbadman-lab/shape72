import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { AppKitProvider } from "@/components/AppKitProvider";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shape72.fun"),
  title: "Shape72",
  description: "72 shapes. 72 owners. One core.",
  authors: [{ name: "SHAPE72" }],
  icons: {
    icon: [{ url: "/shapes/72pfp.png", type: "image/png" }],
    apple: [{ url: "/shapes/72pfp.png", type: "image/png" }],
  },
  openGraph: {
    title: "Shape72",
    description: "72 shapes. 72 owners. One core.",
    type: "website",
    images: [
      {
        url: "/shapes/shape72meta.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shape72",
    description: "72 shapes. 72 owners. One core.",
    images: ["/shapes/shape72meta.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${instrumentSans.variable} h-full`}>
      <body className="min-h-full font-display">
        <AppKitProvider>{children}</AppKitProvider>
      </body>
    </html>
  );
}
