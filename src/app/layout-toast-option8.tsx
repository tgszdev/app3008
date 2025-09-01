// OPÇÃO 8: iOS Style (Estilo Apple - Premium com blur)
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
              position="top-center"
              reverseOrder={false}
              gutter={8}
              toastOptions={{
                duration: 3500,
                style: {
                  background: 'rgba(255, 255, 255, 0.98)',
                  color: '#000000',
                  padding: '20px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginTop: '50px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  backdropFilter: 'blur(20px)',
                  border: '0.5px solid rgba(0,0,0,0.04)',
                  maxWidth: '350px',
                },
                success: {
                  style: {
                    background: 'rgba(255, 255, 255, 0.98)',
                    color: '#34c759',
                  },
                  iconTheme: {
                    primary: '#34c759',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  style: {
                    background: 'rgba(255, 255, 255, 0.98)',
                    color: '#ff3b30',
                  },
                  iconTheme: {
                    primary: '#ff3b30',
                    secondary: '#ffffff',
                  },
                },
                loading: {
                  style: {
                    background: 'rgba(255, 255, 255, 0.98)',
                    color: '#007aff',
                  },
                  iconTheme: {
                    primary: '#007aff',
                    secondary: '#ffffff',
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