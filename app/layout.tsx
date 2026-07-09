import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const ibmArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "وصلها لي | اطلب من الخارج بثقة",
  description:
    "خدمة وسيط طلب من الخارج للسعودية. أرسل رابط المنتج، نراجع السعر، نرسل عرض نهائي، ونساعدك في الشراء والمتابعة.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${ibmArabic.variable} font-sans`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
