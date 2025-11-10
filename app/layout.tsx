import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Automation Dashboard",
  description: "Data automation dashboard for TechFlow Solutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

