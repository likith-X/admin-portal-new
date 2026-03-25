import type { Metadata } from 'next';
import { Syne, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import EditorialLayout from './components/EditorialLayout';

const syne = Syne({ 
  subsets: ['latin'],
  variable: '--font-syne' 
});

const jetbrains = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono' 
});

export const metadata: Metadata = {
  title: 'Agent Herald | Operating System',
  description: 'Decentralized Intelligence Network',
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${syne.variable} ${jetbrains.variable} h-full antialiased bg-[#ffffff] text-[#111111]`}>
        <EditorialLayout>{children}</EditorialLayout>
        <Toaster position="bottom-right" theme="light" expand richColors />
      </body>
    </html>
  );
}
