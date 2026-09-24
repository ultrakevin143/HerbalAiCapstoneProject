import type { Metadata, Viewport } from "next";
import { Newsreader, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./auth-layout.css";
import { AuthProvider } from "../context/AuthContext";
import { DisplayPreferenceSync } from "../components/DisplayPreferences";
import { PwaRegistration } from "../components/PwaInstall";

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
  title: "Herbal Ai",
  description: "Explore documented Philippine medicinal plants and ask Dr. Ai for educational, source-grounded preparation and safety information.",
  keywords: ["Philippine medicinal plants", "herbal medicine", "traditional plant knowledge", "PITAHC", "DOH medicinal plants", "Dr. Ai"],
  authors: [{ name: "Herbal-Ai Team" }],
  applicationName: "Herbal-Ai",
  category: "education",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Herbal-Ai",
  },
  icons: {
    icon: "/pwa-icon-192.png",
    apple: "/pwa-icon-192.png",
  },
  openGraph: {
    type: "website",
    title: "Herbal-Ai — Philippine Medicinal Plants Repository",
    description: "Educational, source-grounded information about Philippine medicinal plants.",
    siteName: "Herbal-Ai",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1b4332",
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
        <PwaRegistration />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
