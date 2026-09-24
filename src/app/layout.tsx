import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { AppKitProvider } from "@/components/AppKitProvider";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-jetbrains-mono",
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
    <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full font-display">
        <AppKitProvider>{children}</AppKitProvider>
      </body>
    </html>
  );
}
