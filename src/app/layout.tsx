import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CIP AI 開發團隊',
  description: '多代理人 AI 開發系統 - 從需求到程式碼的自動化開發流程',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="dark">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
