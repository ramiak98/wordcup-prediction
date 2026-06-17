import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup Predictions",
  description: "Submit and score World Cup 2026 predictions."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
