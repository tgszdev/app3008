import ClientLayout from './client-layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Renderizar o layout client-side diretamente
  // A verificação de autenticação será feita no cliente
  return <ClientLayout>{children}</ClientLayout>
}