import { Metadata } from "next";
import "./globals.css";
import TopNav from "./topnav";
import Footer from "./footer";

export const metadata: Metadata = {
  title: "Sense Financial Analytics Platform",
  description: "Sense is a platform for analyzing finances for small businesses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-svh">
        <TopNav />
        <div className="grow">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
