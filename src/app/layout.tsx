import React from 'react';
import type { Metadata } from "next";
import './globals.css';

export const metadata: Metadata = {
  title: "Kawaii 3Dモデルデモ",
  description: "Kawaii 3Dモデルデモンストレーション",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-black text-white min-h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
