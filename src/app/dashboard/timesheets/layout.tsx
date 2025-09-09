import { ReactNode } from 'react'

export default function TimesheetsLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  )
}