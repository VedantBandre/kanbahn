import Providers from "./providers";
import "./globals.css";

export const metadata = { title: "Kanbahn" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-white text-gray-900 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="max-w-5x1 mx-auto p-4">
          <Providers>{ children }</Providers>
        </div>
      </body>
    </html>
  )
}