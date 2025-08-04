// src/components/EstimatorLoader.tsx

"use client"; // <-- **บรรทัดนี้สำคัญที่สุด!** ทำให้ไฟล์นี้เป็น Client Component

import dynamic from "next/dynamic";

// ย้าย Logic การ import แบบ dynamic ทั้งหมดมาไว้ที่นี่
const DynamicEstimator = dynamic(
  () => import('@/components/Estimator'), // ชี้ไปที่ Estimator ตัวจริง
  { 
    ssr: false, // ตอนนี้เราสามารถใช้ ssr: false ได้แล้ว เพราะเราอยู่ใน Client Component
    loading: () => (
      // สร้าง Loading UI ที่สวยงามขึ้น
      <div className="w-full flex flex-col justify-center items-center p-20 min-h-screen">
        <svg className="animate-spin h-10 w-10 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg font-semibold text-gray-600">กำลังโหลดเครื่องมือประเมินราคา...</p>
      </div>
    )
  }
);

// Export component ที่ทำหน้าที่แค่ render DynamicEstimator
export default function EstimatorLoader() {
  return <DynamicEstimator />;
}