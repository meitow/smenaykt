import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SmenaYKT",
  description: "Подработка и помощь рядом — Якутск",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-page text-[17px] leading-relaxed antialiased">
        {children}
      </body>
    </html>
  );
}
