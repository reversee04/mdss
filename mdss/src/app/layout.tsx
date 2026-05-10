import type { Metadata, Viewport } from 'next'
import { Open_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' })

export const metadata: Metadata = {
  title: 'MDSS - Malawi Disease Surveillance System',
  description: 'National Disease Surveillance and Analytics Platform for the Ministry of Health, Malawi',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: 'null',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: 'null',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: 'null',
        type: 'image/svg+xml',
      },
    ],
    apple: 'null',
  },
}

export const viewport: Viewport = {
  themeColor: '#006cbf',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${openSans.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
