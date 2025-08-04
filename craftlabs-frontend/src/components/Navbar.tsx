// src/components/Navbar.tsx

"use client";

import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-card/80 backdrop-blur-lg border-b border-border-light">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="CraftLabs Logo" width={40} height={40} />
          <span className="text-xl font-bold text-text-primary hidden sm:block">
            CraftLabs Estimator
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <a href="#contact" className="text-text-secondary hover:text-neon-primary transition-colors">
            ติดต่อ
          </a>
          <button className="bg-gradient-to-r from-neon-primary to-orange-500 text-white font-semibold px-4 py-2 rounded-lg hover:shadow-neon transition-transform transform hover:-translate-y-0.5">
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    </nav>
  );
}