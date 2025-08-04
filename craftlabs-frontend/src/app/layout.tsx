// src/app/layout.tsx

import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // Import Navbar

const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CraftLabs 3D - Price Estimator",
  description: "อัปโหลดและประเมินราคาปริ้น 3 มิติหลายไฟล์พร้อมกัน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={kanit.className}>
        <Navbar />
        <div className="pt-20"> {/* Add padding top to avoid content being hidden by fixed navbar */}
            {children}
        </div>
        <footer className="w-full text-center py-8 text-text-tertiary">
            <p>© {new Date().getFullYear()} CraftLabs3D. All Rights Reserved.</p>
        </footer>
      </body>
    </html>
  );
}