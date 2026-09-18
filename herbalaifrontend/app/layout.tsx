import type { Metadata } from "next";
import { Newsreader, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { DisplayPreferenceSync } from "../components/DisplayPreferences";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-editorial",
  display: "swap",
  style: ["normal", "italic"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Herbal AI — Philippine Medicinal Plants Repository",
  description: "Explore traditional Philippine medicinal plants, search scientific formulations, and consult Dr. AI, an interactive chatbot for local herbal knowledge.",
  keywords: ["medicinal plants", "philippines", "herbal medicine", "sari-sari health", "traditional herbs", "dr ai"],
  authors: [{ name: "Herbal AI Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full antialiased ${newsreader.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans bg-canvas text-ink">
        <script dangerouslySetInnerHTML={{ __html: `try{const preferences=JSON.parse(localStorage.getItem('herbal-ai-display')||'{}');const isDark=preferences?.theme==='dark';document.documentElement.dataset.theme=isDark?'dark':'light';document.documentElement.classList.toggle('dark',isDark);document.documentElement.dataset.textSize=['large','extra-large'].includes(preferences?.size)?preferences.size:'normal'}catch{}` }} />
        <DisplayPreferenceSync />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
