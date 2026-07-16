import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const ibmArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://waselhali.com"),
  title: "وصلها لي | نشتري لك من الصين ونوصلها إلى السعودية",
  description:
    "أرسل رابط المنتج من الصين أو المتاجر العالمية، واحصل على تكلفة تقديرية وخدمة شراء وشحن إلى السعودية عبر وصلها لي.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "وصلها لي | نشتري لك من الصين ونوصلها إلى السعودية",
    description: "خدمة شراء وشحن مستقلة من المتاجر العالمية إلى السعودية. أرسل الرابط ونراجع لك التكلفة قبل الشراء.",
    url: "/",
    siteName: "وصلها لي",
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "وصلها لي | نشتري لك من الصين ونوصلها إلى السعودية",
    description: "أرسل رابط المنتج واحصل على تكلفة تقديرية وخدمة شراء وشحن إلى السعودية.",
  },
};


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${ibmArabic.variable} font-sans`} suppressHydrationWarning>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-69N27RS00Y"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-69N27RS00Y');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}




