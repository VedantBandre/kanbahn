"use client";

import "./globals.css";
import Providers from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ minHeight: "100dvh" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
