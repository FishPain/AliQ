import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Viralize Me",
  description: "One-stop AI social media content generator leveraging hot trends, persona analysis and goal-oriented strategy to craft personalized, high-quality content.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
        {/* <CrispProvider/> */}
        <body className={inter.className}>{children}</body>
      </html>
  );
}
