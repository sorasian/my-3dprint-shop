// src/app/page.tsx

// ไม่ต้องใช้ dynamic ที่นี่แล้ว
import EstimatorLoader from '@/components/EstimatorLoader';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center">
      {/* เรียกใช้ Loader Component ที่เราสร้างขึ้น */}
      <EstimatorLoader />
      
      <footer className="w-full text-center py-8 text-gray-500 text-sm">
        <p>CraftLabs 3D | 089-937-9279 | LINE OA: @craftlabs</p>
      </footer>
    </main>
  );
}