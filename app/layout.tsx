import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kabox CDN - Modern File Hosting Service',
  description: 'Free, fast and secure CDN service for all your files',
  keywords: ['cdn', 'file hosting', 'url shortener', 'media sharing', 'upload'],
  authors: [{ name: 'aka', url: 'https://akadev.me' }],
  creator: 'aka',
  publisher: 'Kabox',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kabox.my.id',
    title: 'Kabox CDN - Modern File Hosting Service',
    description: 'Free, fast and secure CDN service for all your files',
    siteName: 'Kabox CDN',
    images: [
      {
        url: 'https://raw.githubusercontent.com/akaanakbaik/my-cdn/main/logokaboxnobg.png',
        width: 1200,
        height: 630,
        alt: 'Kabox CDN',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kabox CDN - Modern File Hosting Service',
    description: 'Free, fast and secure CDN service for all your files',
    images: ['https://raw.githubusercontent.com/akaanakbaik/my-cdn/main/logokaboxnobg.png'],
    creator: '@akaanakbaik',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  verification: {
    google: '',
    yandex: '',
    yahoo: '',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}