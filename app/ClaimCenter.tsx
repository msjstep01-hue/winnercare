"use client";

import { useState } from "react";
import ClaimWizard from "./ClaimWizard";

/* ─────────────────────────────────────────────────────────
 * 공통 뱃지
 * ───────────────────────────────────────────────────────── */
function StarBadge({ label = "가상팩스번호" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
      ★ {label}
    </span>
  );
}
function DotBadge({ label = "단체실손가능" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
      ● {label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
 * 보험사 데이터 타입 및 목록(팩스 포함)
 * ───────────────────────────────────────────────────────── */
export type Carrier = {
  id: string;
  name: string;
  logo?: string;
  fax?: string;               // ← 팩스번호
  star?: boolean;
  flags?: ("fax" | "group")[];
};

const NONLIFE: Carrier[] = [
  { id: "aig", name: "AIG손해보험", logo: "aig.png", fax: "02-2011-4607" },
  { id: "kb", name: "KB손해보험", logo: "kb.png", fax: "0505-136-6500", star: true },
  { id: "samsung", name: "삼성화재", logo: "samsungfire.png", fax: "0505-162-0872" },
  { id: "db", name: "DB손해보험", logo: "db.png", fax: "0505-181-4862", star: true },
  { id: "meritz", name: "메리츠화재", logo: "meritz.png", fax: "0505-021-3400/3500" },
  { id: "hyundai", name: "현대해상", logo: "hyundai.png", fax: "0507-774-6060", star: true },
  { id: "lotte", name: "롯데손해보험", logo: "lotte.png", fax: "0507-333-9999" },
  { id: "hana", name: "하나손해보험", logo: "hana.png", fax: "가상팩스번호 발급요망" },
  { id: "carrot", name: "캐롯손해보험", logo: "carrot.png", fax: "가상팩스번호 발급요망" },
  { id: "mg", name: "MG손해보험", logo: "mg.png", fax: "0505-088-1646" },
  { id: "ez", name: "신한EZ손해보험", logo: "sh-ez.png", fax: "가상팩스번호 발급요망" },
  { id: "post", name: "우체국보험", logo: "post.png", fax: "0504-800-1300" },
];

const LIFE: Carrier[] = [
  { id: "nhlife", name: "NH농협생명", logo: "nh.png", fax: "02-6971-6040" },
  { id: "shinhanlife", name: "신한라이프", logo: "shinhanlife.png", fax: "가상팩스" },
  { id: "abl", name: "ABL생명", logo: "abl.png", fax: "가상팩스" },
  { id: "kdb", name: "KDB생명", logo: "kdb-life.png", fax: "02-266-7939" },
  { id: "lina", name: "라이나생명", logo: "lina.png", fax: "02-6944-1200" },
  { id: "dblife", name: "DB생명", logo: "dblife.png", fax: "0505-129-4758" },
  { id: "metlife", name: "메트라이프생명", logo: "metlife.png", fax: "가상팩스" },
  { id: "hanwha", name: "한화생명", logo: "hanwha.png", fax: "가상팩스", star: true },
  { id: "dongyang", name: "동양생명", logo: "dongyang.png", fax: "정액: 02-3289-4517 / 실손: 02-3289-4516" },
  { id: "imlife", name: "iM라이프", logo: "imlife.png", fax: "0505-047-7000" },
  { id: "samsung-life", name: "삼성생명", logo: "samsunglife.png", fax: "가상팩스" },
  { id: "kyobo", name: "교보생명", logo: "kyobo.png", fax: "가상팩스", star: true },
  { id: "kb-life", name: "KB라이프생명", logo: "kb-life.png", fax: "가상팩스" },
  { id: "mirae", name: "미래에셋생명", logo: "miraeasset.png", fax: "가상팩스" },
  { id: "chubb", name: "처브라이프생명", logo: "chubb.png", fax: "가상팩스" },
  { id: "hana-life", name: "하나생명", logo: "hanwhalife.png", fax: "가상팩스" },
];

/* ─────────────────────────────────────────────────────────
 * 카드/그리드
 * ───────────────────────────────────────────────────────── */
function CarrierCard({
  c,
  onSelect,
}: {
  c: Carrier;
  onSelect: (c: Carrier) => void;
}) {
  const logoSrc = c.logo ? `/logos/${c.logo}` : "";
  return (
    <button
      onClick={() => onSelect(c)}
      className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl border-2 bg-white hover:shadow-lg hover:border-orange-300 transition text-left"
      title={c.name}
    >
      {logoSrc ? (
        <img src={logoSrc} alt={c.name} className="h-16 w-auto object-contain" />
      ) : (
        <span className="h-16 w-16 inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xl font-semibold">
          {c.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className="flex-1 text-xl text-gray-900 font-semibold">{c.name}</span>
      <span className="flex items-center gap-3">
        {c.flags?.includes("fax") && <StarBadge label="가상팩스번호" />}
        {c.flags?.includes("group") && <DotBadge label="단체실손가능" />}
        {c.star && <span className="text-orange-500 text-xl">★</span>}
        <span className="text-gray-300 text-2xl">›</span>
      </span>
    </button>
  );
}

function CarrierGrid({
  items,
  onSelect,
}: {
  items: Carrier[];
  onSelect: (c: Carrier) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {items.map((c) => (
        <CarrierCard key={c.id} c={c} onSelect={onSelect} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * 보험금청구 메인(탭 + 리스트 + 모달)
 * ───────────────────────────────────────────────────────── */
export function ClaimCenter() {
  type Tab = "nonlife" | "life";
  const [tab, setTab] = useState<Tab>("nonlife");

  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeCarrier, setActiveCarrier] = useState<Carrier | null>(null);

  const onSelect = (c: Carrier) => {
    console.log("select:", c); // 디버그 로그
    setActiveCarrier(c);
    setWizardOpen(true);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "nonlife", label: "손해보험" },
    { key: "life", label: "생명보험" },
  ];
  const current = tab === "nonlife" ? NONLIFE : LIFE;

  return (
    <div className="space-y-6">
      {/* 상단 라벨/버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StarBadge />
          <DotBadge />
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 text-white hover:bg-orange-600 text-lg font-semibold">
          🔗 청구링크 전송
        </button>
      </div>

      {/* 탭 */}
      <div className="grid grid-cols-2 rounded-xl overflow-hidden border-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`py-4 text-xl font-bold border-r-2 last:border-r-0 ${
              tab === t.key
                ? "bg-orange-500 text-white"
                : "bg-white hover:bg-orange-50 text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 리스트 */}
      <div className="rounded-2xl border-2 bg-white p-5">
        <CarrierGrid items={current} onSelect={onSelect} />
      </div>

      {/* 모달 */}
      {wizardOpen && activeCarrier && (
        <ClaimWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          carrier={activeCarrier}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * 좌측 메뉴 포함 메인 레이아웃
 * ───────────────────────────────────────────────────────── */
export default function WinnerCareCRM() {
  const [menu, setMenu] =
    useState<"home" | "customers" | "consult" | "claim">("claim");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <aside className="w-64 bg-white text-gray-800 border-r p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <img src="/winner-logo-black.png" alt="Winner Logo" className="h-10" />
          <h1 className="text-xl font-bold text-gray-900">위너케어</h1>
        </div>
        <nav className="flex flex-col space-y-2">
          {[
            { id: "home", label: "🏠 홈" },
            { id: "customers", label: "👥 고객관리" },
            { id: "consult", label: "💬 상담관리" },
            { id: "claim", label: "🧾 보험금청구" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMenu(item.id as any)}
              className={`text-left px-4 py-2 rounded-lg font-medium transition ${
                menu === item.id
                  ? "bg-orange-500 text-white shadow"
                  : "hover:bg-orange-50 text-gray-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* 본문 */}
      <main className="flex-1 p-8">
        {menu === "home" && (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-orange-600">
              🧡 WinnerCare CRM
            </h2>
            <p className="text-lg text-gray-700">
              왼쪽 메뉴를 눌러 원하는 기능을 이용하세요.
            </p>
          </div>
        )}

        {menu === "customers" && (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-orange-600">👥 고객관리</h2>
            <p className="text-lg text-gray-700">고객관리 화면은 이후 확장할 수 있습니다.</p>
          </div>
        )}

        {menu === "consult" && (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-orange-600">💬 상담관리</h2>
            <p className="text-lg text-gray-700">상담 템플릿/비교설명 확인 등 모듈 추가 예정.</p>
          </div>
        )}

        {menu === "claim" && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-orange-600">🧾 보험금청구</h2>
            <ClaimCenter />
          </div>
        )}
      </main>
    </div>
  );
}
