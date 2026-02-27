import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trust Hub",
  description: "Local SOC 2 compliance management proof of concept",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
