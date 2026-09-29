import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { LanguageProvider, AuthProvider, ModalProvider, UniversityProvider } from "@/lib/context";
import ClientErrorCatcher from "@/components/ClientErrorCatcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campie – Ghana's Campus Marketplace",
  description: "Buy, sell, rent items and post events with fellow Ghanaian university students safely and easily.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{localStorage.removeItem("theme")}catch(e){}` }} />
      </head>
      <body className="bg-white dark:bg-gray-950 text-gray-900 antialiased">
        <ThemeProvider attribute="class" defaultTheme="light">
          <LanguageProvider>
            <AuthProvider>
              <ModalProvider>
                <UniversityProvider>
                  {children}
                </UniversityProvider>
              </ModalProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        <ClientErrorCatcher />
      </body>
    </html>
  );
}
