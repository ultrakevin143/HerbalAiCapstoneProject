import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
