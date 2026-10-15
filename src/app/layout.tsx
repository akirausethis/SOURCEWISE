import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "SOURCEWISE — Academic AI Research Workspace",
  description:
    "A distinctive, evidence-grounded research workspace for students, thesis writers, and researchers. Read papers, extract citations, synthesize literature, and explore research gaps.",
  keywords: [
    "academic research",
    "literature review",
    "thesis workspace",
    "evidence extraction",
    "PDF reader",
    "research gap exploration",
    "verifiable citations",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased selection:bg-amber-200 selection:text-zinc-900`}
      >
        {children}
      </body>
    </html>
  );
}
