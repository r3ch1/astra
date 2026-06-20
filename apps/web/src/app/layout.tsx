import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astra — Mapa Natal",
  description:
    "Plataforma de mapas astrológicos com IA. Cálculo preciso via Swiss Ephemeris.",
};

// O Next exige default export em layout.tsx (arquivo especial do App Router).
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
