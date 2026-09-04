import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { EnquiryButton } from "@/components/ui/enquiry-button";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import { getSiteSettings } from "@/lib/api";

export const dynamic = "force-dynamic";

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
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#f2eee3",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteSettings = await getSiteSettings();

  return (
    <html lang="en" className={`light ${poppins.variable} bg-background`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <SiteSettingsProvider settings={siteSettings}>
          <SiteNav />

          {children}

          <SiteFooter settings={siteSettings} />
          <EnquiryButton />
          <WhatsAppButton floating />

          {process.env.NODE_ENV === "production" && <Analytics />}

          <GoogleAnalytics gaId="G-RRKKE6VCKY" />
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
