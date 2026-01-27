import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AppProvider } from '@/contexts/app-provider';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes"; // Import ThemeProvider

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
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
        >
          <AppProvider>
            {children}
            <Toaster />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
