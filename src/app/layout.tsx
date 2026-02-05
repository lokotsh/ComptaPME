import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ComptaPME - Logiciel Comptable pour PME",
    template: "%s | ComptaPME",
  },
  description:
    "Logiciel SaaS comptable pour PME africaines. Gérez votre comptabilité, facturation, paie et fiscalité en toute autonomie.",
  keywords: [
    "comptabilité",
    "PME",
    "Bénin",
    "Afrique",
    "facturation",
    "paie",
    "TVA",
    "CNSS",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
