import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function TicketDetailsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}