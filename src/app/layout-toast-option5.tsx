// OPÇÃO 5: Floating Card (Elegante com bordas coloridas - Altamente Recomendado)
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
              position="bottom-right"
              reverseOrder={false}
              gutter={12}
              toastOptions={{
                duration: 5000,
                style: {
                  background: '#ffffff',
                  color: '#1f2937',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '2px solid #e5e7eb',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  marginBottom: '20px',
                  marginRight: '20px',
                  minWidth: '300px',
                },
                success: {
                  style: {
                    background: '#ffffff',
                    color: '#059669',
                    border: '2px solid #10b981',
                  },
                  icon: '✅',
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  style: {
                    background: '#ffffff',
                    color: '#dc2626',
                    border: '2px solid #ef4444',
                  },
                  icon: '❌',
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
                loading: {
                  style: {
                    background: '#ffffff',
                    color: '#2563eb',
                    border: '2px solid #3b82f6',
                  },
                  iconTheme: {
                    primary: '#3b82f6',
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