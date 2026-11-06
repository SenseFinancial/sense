import { Metadata } from "next";
import "./globals.css";
import TopNav from "./topnav";

export const metadata: Metadata = {
  title: "Sense Financial Analytics Platform",
  description: "Sense is a platform for analyzing finances for small businesses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
