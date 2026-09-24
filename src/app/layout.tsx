import type { Metadata } from "next";
import { Courier_Prime } from "next/font/google";
import { AppKitProvider } from "@/components/AppKitProvider";
import "./globals.css";

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
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
    <html lang="en" className={`${courierPrime.variable} h-full`}>
      <body className="min-h-full font-display">
        <AppKitProvider>{children}</AppKitProvider>
      </body>
    </html>
  );
}
