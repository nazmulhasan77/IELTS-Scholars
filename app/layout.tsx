import type { Metadata } from "next";
import "./globals.css";
import "./product.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://ielts-scholars.no-edit-profile3.chatgpt.site"),
  title: "IELTS Scholars — Practice Smarter. Score Higher.",
  description: "Exam-style IELTS mock tests, clear band insights, and personalised practice for all four modules.",
  openGraph: {
    title: "IELTS Scholars — Practice Smarter. Score Higher.",
    description: "Exam-style IELTS mock tests, clear band insights, and personalised practice for all four modules.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "IELTS Scholars — Practice smarter. Score higher." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "IELTS Scholars — Practice Smarter. Score Higher.",
    description: "Exam-style IELTS practice for all four modules.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
