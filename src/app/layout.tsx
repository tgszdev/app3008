import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { OrganizationProvider } from '@/contexts/OrganizationContext'
// AppInitializer removido - não funciona no Vercel

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
            <OrganizationProvider>
              {children}
            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={8}
              toastOptions={{
                duration: 5000,
                className: 'toast-notification',
                style: {
                  background: '#323232',
                  color: '#ffffff',
                  padding: '14px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '400',
                  margin: '8px',
                  width: 'auto',
                  minWidth: '250px',
                  maxWidth: 'min(90vw, 500px)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.25)',
                  zIndex: 99999,
                },
                success: {
                  iconTheme: {
                    primary: '#4caf50',
                    secondary: '#323232',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#f44336',
                    secondary: '#323232',
                  },
                },
                loading: {
                  iconTheme: {
                    primary: '#2196f3',
                    secondary: '#323232',
                  },
                },
              }}
            />
            </OrganizationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}