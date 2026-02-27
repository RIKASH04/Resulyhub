import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ResultHub – Official Result Portal',
  description: 'Check your academic results online. ResultHub is the official result management portal for students.',
  keywords: 'result, marksheet, student result, academic result, school result',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
