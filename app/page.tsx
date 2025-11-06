"use client";

import Link from "next/link";
import ClaimCenter from "./ClaimCenter";

export default function Page() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <aside className="w-64 bg-white text-gray-800 border-r p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <img src="/winner-logo-black.png" alt="Winner Logo" className="h-10" />
          <h1 className="text-xl font-bold text-gray-900">위너케어</h1>
        </div>
        <nav className="flex flex-col space-y-2">
          <Link
            href="/"
            className="text-left px-4 py-2 rounded-lg font-medium bg-orange-500 text-white shadow"
          >
            🧾 보험금청구
          </Link>
          <Link
            href="/commission"
            className="text-left px-4 py-2 rounded-lg font-medium hover:bg-orange-50 text-gray-700"
          >
            💰 수수료계산기
          </Link>
        </nav>
      </aside>

      {/* 본문 */}
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold text-orange-600 mb-6">🧾 보험금청구</h2>
        <ClaimCenter />
      </main>
    </div>
  );
}
