import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

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

export const viewport: Viewport = {
  themeColor: '#0b1e3d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://app.tracmatrix.com'),
  title: {
    default: 'Tracmatrix — Smart Employee Productivity & Workforce Management Platform',
    template: '%s | Tracmatrix',
  },
  description:
    'Enterprise workforce analytics and employee proof-of-work monitoring platform. Track real-time work hours, automated screenshots, dual screen capture, timesheet attendance, slacking detection, and app/website usage.',
  keywords: [
    'employee tracking software',
    'workforce productivity monitoring',
    'time tracking tool',
    'automated screenshot monitoring',
    'attendance and timesheets',
    'remote team management',
    'Tracmatrix',
    'employee behavior analytics',
    'bKash subscription tracker',
    'proof of work software',
  ],
  authors: [{ name: 'Tracmatrix Inc.', url: 'https://app.tracmatrix.com' }],
  creator: 'Tracmatrix',
  publisher: 'Tracmatrix',
  alternates: {
    canonical: 'https://app.tracmatrix.com',
  },
  openGraph: {
    title: 'Tracmatrix — Smart Employee Productivity & Workforce Monitoring',
    description:
      'Monitor work hours, track computer activity, and get real-time insights into your team’s performance with automated screenshots and timesheets.',
    url: 'https://app.tracmatrix.com',
    siteName: 'Tracmatrix',
    images: [
      {
        url: '/images/trackmatrix-logo-darkmode.png',
        width: 1200,
        height: 630,
        alt: 'Tracmatrix Employee Monitoring Software',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tracmatrix — Smart Employee Productivity & Workforce Monitoring',
    description:
      'Next-generation employee productivity monitoring, automated screenshots, and proof-of-work software.',
    images: ['/images/trackmatrix-logo-darkmode.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/images/trackmatrix-icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/trackmatrix-icon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/images/trackmatrix-icon.png',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Tracmatrix',
  operatingSystem: 'Windows, macOS, Android, Web',
  applicationCategory: 'BusinessApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description:
    'Comprehensive employee activity monitoring, multi-session time tracking, automated screenshot captures, and workforce analytics platform.',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '5280',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
