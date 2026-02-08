import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const serif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SafeTag — Your Vehicle's Silent Guardian",
  description:
    "SafeTag lets anyone scan a QR on your vehicle to contact you instantly via WhatsApp, call, or emergency alert. Protect your vehicle today.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${serif.variable} ${sans.variable} font-sans antialiased`}>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
