import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { EnquiryButton } from "@/components/ui/enquiry-button";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Videha Overseas Private Limited",
  description:
    "Videha Overseas is an agricultural products exporter from India, supplying premium makhana, fox nuts, and food grade guar gum to international buyers.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f2eee3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${poppins.variable} bg-background`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <SiteNav />

        {children}

        <SiteFooter />
        <EnquiryButton/>
        <WhatsAppButton floating />

        {process.env.NODE_ENV === "production" && <Analytics />}

        <GoogleAnalytics gaId="G-RRKKE6VCKY" />
      </body>
    </html>
  );
}
