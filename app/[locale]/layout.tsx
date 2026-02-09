import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './../../globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kabox CDN - Modern File Hosting Service',
  description: 'Free, fast and secure CDN service for all your files',
}

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'id' }]
}

export default function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = params
  
  return (
    <html lang={locale}>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}