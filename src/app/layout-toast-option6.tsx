// OPÇÃO 6: Notification Bar (Estilo Slack - Profissional)
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AuthProvider } from '@/components/providers/auth-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Suporte Técnico',
  description: 'Sistema completo de gestão de chamados técnicos - Deploy 01/09/2025 22:30',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Suporte Técnico',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Sistema de Suporte Técnico',
    title: 'Sistema de Suporte Técnico',
    description: 'Sistema completo de gestão de chamados técnicos',
  },
  twitter: {
    card: 'summary',
    title: 'Sistema de Suporte Técnico',
    description: 'Sistema completo de gestão de chamados técnicos',
  },
}

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster
              position="top-left"
              reverseOrder={false}
              gutter={8}
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1a1a1a',
                  color: '#ffffff',
                  padding: '14px 20px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '400',
                  borderLeft: '4px solid #6b7280',
                  marginTop: '80px',
                  marginLeft: '20px',
                  minWidth: '280px',
                },
                success: {
                  style: {
                    borderLeft: '4px solid #22c55e',
                  },
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#1a1a1a',
                  },
                },
                error: {
                  style: {
                    borderLeft: '4px solid #ef4444',
                  },
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#1a1a1a',
                  },
                },
                loading: {
                  style: {
                    borderLeft: '4px solid #3b82f6',
                  },
                  iconTheme: {
                    primary: '#3b82f6',
                    secondary: '#1a1a1a',
                  },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}