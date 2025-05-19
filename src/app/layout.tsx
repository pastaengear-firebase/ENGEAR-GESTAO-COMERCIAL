import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google'; // Corrected import from next/font/google
import './globals.css';
import { AppProvider } from '@/contexts/app-provider';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({ // Corrected usage
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({ // Corrected usage
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CONTROLE DE VENDAS – EQUIPE COMERCIAL ENGEAR',
  description: 'Sistema de controle de vendas para a equipe comercial ENGEAR.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProvider>
          {children}
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
