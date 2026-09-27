import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Smart Employee Tracker - Employee Productivity & Proof of Work SaaS",
  description: "Smart Employee Tracker by Rsm Monaem. Next-generation employee productivity monitoring, automated 1-minute screenshots, and localized subscriptions with bKash, merchant.eps.com.bd, and Stripe.",
  authors: [{ name: "Rsm Monaem", url: "https://www.linkedin.com/in/rsm-monaem/" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
