import type { Metadata } from "next";
// Import font Inter từ Google Fonts của Next.js
import { Inter } from "next/font/google"; 
import "./globals.css";

// Cấu hình font: BẮT BUỘC phải có subset 'vietnamese' để không bị lỗi dấu
const inter = Inter({ 
  subsets: ["vietnamese"], 
  weight: ["300", "400", "500", "600", "700"],
  display: "swap", // Giúp load font mượt mà không bị giật màn hình
});

export const metadata: Metadata = {
  title: "Spartan Logistics",
  description: "Hệ thống quản lý kho vận thông minh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      {/* Gắn inter.className vào thẻ body để áp dụng font cho toàn bộ App */}
      <body className={`${inter.className} bg-slate-900 text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}