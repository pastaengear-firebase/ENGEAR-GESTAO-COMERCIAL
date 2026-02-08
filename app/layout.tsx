import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ENGEAR - Gestão Comercial',
  description: 'Sistema de controle de vendas ENGEAR',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}