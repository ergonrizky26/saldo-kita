import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#4f46e5", // Warna ungu indigo DompetKita
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "DompetKita",
  description: "Atur keuangan anda dan pasangan dengan mudah",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DompetKita",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}


// export const metadata: Metadata = {
//   title: "DompetKita",
//   description: "Atur keuangan keluarga dengan mudah",
//   manifest: "/manifest.json",
//   themeColor: "#4f46e5", // Sesuaikan dengan warna pilihan Anda
//   viewport: "width=device-width, initial-scale=1, maximum-scale=1",
//   appleWebApp: {
//     capable: true,
//     statusBarStyle: "default",
//     title: "DompetKita",
//   },
// };