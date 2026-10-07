import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jbMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Last Secure Code Benchmark: Is the Code You Vibe Secure?",
  description:
    "Last Secure Code Benchmark (LSCB) — 450 tasks built from 150 real vulnerabilities across 7 languages, 115 CVEs and 24 CWEs. Each task asks a coding agent to implement a functional specification that never mentions security, but whose required behavior is derived from a real vulnerability fix. A submission counts only when the project's tests pass and the original exploit fails.",
  keywords: ["CyberSecurity", "Code Generation", "Agent", "Secure Code Generation"],
  openGraph: {
    title: "Last Secure Code Benchmark: Is the Code You Vibe Secure?",
    description:
      "450 tasks from 150 real vulnerabilities. Agents reconstruct code from security-blind functional specs; reward = tests pass ∧ original exploit fails.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jbMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* 首绘前定主题，避免闪烁：localStorage > 系统偏好 > dark */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(!t)t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
