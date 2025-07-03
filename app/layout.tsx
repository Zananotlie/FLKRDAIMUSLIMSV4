import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FLKRDMUSLIMS',
  description: 'Created with FLKRD AI',
  generator: 'ZANA AI ',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
