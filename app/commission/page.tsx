"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

// 엑셀 행 정규화 유틸
function normalizeRateRow(row: any) {
  const num = (v: any) => {
    if (v == null) return undefined;
    const s = String(v).replace(/[% ,]/g, "");
    const n = Number(s);
    return isNaN(n) ? undefined : n;
  };
  const get = (keys: string[]) => {
    for (const k of Object.keys(row)) if (keys.some((kk) => String(k).includes(kk))) return row[k];
    return undefined;
  };
  const insurer = (get(["보험사"]) ?? "").toString().trim();
  const product = (get(["상품"]) ?? "").toString().trim();
  if (!product) return null;

  const rates: Record<string, number | undefined> = {
    계: num(get(["계"])),
    익월: num(get(["익월"])),
    "2~12회": num(get(["2~12"])),
    "2차년도": num(get(["2차"])),
    "3차년도": num(get(["3차"])),
    "4~10차년도": num(get(["4~10", "4-10", "4~10년"])),
    "7~12회": num(get(["7~12"])),
    "13~14회": num(get(["13~14"])),
    "15회": num(get(["15회", "15"])),
  };

  let 구분: "생보" | "손보" | "" = "";
  const hasNonlife = rates["7~12회"] != null || rates["13~14회"] != null || rates["15회"] != null;
  const hasLife = rates["2차년도"] != null || rates["3차년도"] != null || rates["4~10차년도"] != null;
  if (hasNonlife) 구분 = "손보";
  else if (hasLife) 구분 = "생보";
  else {
    if (/(손해|손보|화재)/.test(insurer)) 구분 = "손보";
    if (/(생명|라이프)/.test(insurer)) 구분 = "생보";
  }

  const anyRate = Object.values(rates).some((v) => typeof v === "number");
  if (!anyRate) return null;

  return { 보험사: insurer, 상품명: product, 구분, rates };
}

export default function CommissionPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [payout, setPayout] = useState(70);
  const [roundMode, setRoundMode] = useState<"round" | "floor" | "ceil">("round");
  const [selected, setSelected] = useState<any>(null);

  // 기본 JSON 불러오기 (선택: public/commission_rates.json 존재 시 자동 로드)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/commission_rates.json", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (Array.isArray(j)) setRows(j);
      } catch {}
    })();
  }, []);

  // 엑셀 업로드
  const onFile = async (file: File) => {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });
    const all: any[] = [];
    for (const name of wb.SheetNames) {
      const ws = wb.Sheets[name];
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" }) as any[][];
      if (!aoa.length) continue;
      let headerIdx = 0;
      for (let i = 0; i < Math.min(20, aoa.length); i++) {
        const line = aoa[i].join(" ");
        if (line.includes("보험") && line.includes("상품")) {
          headerIdx = i;
          break;
        }
      }
      const header = aoa[headerIdx].map((v) => String(v || "").trim());
      const dataRows = aoa.slice(headerIdx + 1);
      const objs = dataRows.map((r) => {
        const o: any = {};
        header.forEach((h: string, i: number) => (o[h || `COL${i}`] = r[i]));
        return o;
      });
      all.push(...objs);
    }
    const normalized = all.map(normalizeRateRow).filter((x: any) => x && x.상품명);
    setRows(normalized);
    alert(`업로드 완료! 상품 ${normalized.length.toLocaleString()}건을 읽었습니다.`);
  };

  const list = (query
    ? rows.filter(
        (r: any) =>
          r.상품명.toLowerCase().includes(query.toLowerCase()) ||
          (r.보험사 || "").toLowerCase().includes(query.toLowerCase())
      )
    : rows
  ).slice(0, 100);

  const roundBy = (v: number) => {
    const after =
      roundMode === "floor" ? Math.floor(v) : roundMode === "ceil" ? Math.ceil(v) : Math.round(v);
    return Math.floor(after / 100) * 100; // 100원 절사
  };

  const calcAmt = (pct?: number) => {
    const amt = Number(String(amount).replace(/[, ]/g, ""));
    if (!selected || !amt || isNaN(amt) || pct == null) return 0;
    return roundBy(amt * (pct / 100) * (payout / 100));
  };

  const scheduleLabel = (kind: "생보" | "손보", label: string) => {
    if (kind === "손보") {
      switch (label) {
        case "익월":
          return "익월";
        case "7~12회":
          return "7~12회차";
        case "13~14회":
          return "13~14회차";
        case "15회":
          return "15회차";
        default:
          return "-";
      }
    } else {
      switch (label) {
        case "익월":
          return "익월";
        case "2~12회":
          return "2~12회차";
        case "2차년도":
          return "2차년도(13~24회차)";
        case "3차년도":
          return "3차년도(25~36회차)";
        case "4~10차년도":
          return "4~10차년도(37~120회차)";
        default:
          return "-";
      }
    }
  };

  const detail = (() => {
    if (!selected) return null;
    const r = selected.rates;
    const looksNonlife = r["7~12회"] != null || r["13~14회"] != null || r["15회"] != null;
    if (looksNonlife || selected.구분 === "손보") {
      const items = [
        { label: "익월", pct: r["익월"] },
        { label: "7~12회", pct: r["7~12회"] },
        { label: "13~14회", pct: r["13~14회"] },
        { label: "15회", pct: r["15회"] },
      ].map((it) => ({ ...it, schedule: scheduleLabel("손보", it.label) }));
      const totalPct = r["계"] ?? items.reduce((s, it) => (it.pct ?? 0) + s, 0);
      return { items, totalPct };
    } else {
      const items = [
        { label: "익월", pct: r["익월"] },
        { label: "2~12회", pct: r["2~12회"] },
        { label: "2차년도", pct: r["2차년도"] },
        { label: "3차년도", pct: r["3차년도"] },
        { label: "4~10차년도", pct: r["4~10차년도"] },
      ].map((it) => ({ ...it, schedule: scheduleLabel("생보", it.label) }));
      const totalPct = r["계"] ?? items.reduce((s, it) => (it.pct ?? 0) + s, 0);
      return { items, totalPct };
    }
  })();

  const computedTotal = detail ? calcAmt(detail.totalPct) : 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <aside className="w-64 bg-white text-gray-800 border-r p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <img src="/winner-logo-black.png" alt="Winner Logo" className="h-10" />
          <h1 className="text-xl font-bold text-gray-900">위너케어</h1>
        </div>
        <nav className="flex flex-col space-y-2">
          <a href="/" className="text-left px-4 py-2 rounded-lg font-medium hover:bg-orange-50">
            🧾 보험금청구
          </a>
          <span className="text-left px-4 py-2 rounded-lg font-medium bg-orange-500 text-white shadow">
            💰 수수료계산기
          </span>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6 text-orange-600">💰 수수료 계산기 (엑셀 연동)</h2>

        {/* 업로드 / 기본 데이터 */}
        <div className="bg-white p-6 rounded-2xl shadow mb-8 max-w-3xl">
          <p className="mb-3 text-base text-gray-700">생보/손보 수수료 엑셀(.xlsx)을 업로드하거나, 기본 데이터를 불러오세요.</p>
          <div className="flex items-center gap-4">
            <input type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files && onFile(e.target.files[0])} />
            <button
              onClick={async () => {
                try {
                  const r = await fetch("/commission_rates.json", { cache: "no-store" });
                  if (!r.ok) throw new Error(`HTTP ${r.status}`);
                  const j = await r.json();
                  if (!Array.isArray(j)) throw new Error("JSON 형식 오류");
                  setRows(j);
                  alert(`기본 데이터 로드 완료! 상품 ${j.length.toLocaleString()}건`);
                } catch (e: any) {
                  alert(`기본 데이터 로드 실패: ${e?.message}`);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 text-base font-semibold"
            >
              기본 데이터 불러오기
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">기본 데이터: <code>public/commission_rates.json</code></p>
        </div>

        {/* 상품 검색 */}
        <div className="bg-white p-6 rounded-2xl shadow mb-8 max-w-3xl">
          <label className="block text-base font-semibold mb-3 text-gray-800">상품명 / 보험사</label>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            placeholder="예: H10 건강보험, 한화생명"
            className="w-full border-2 rounded-xl p-3 text-lg"
          />
          {list.length > 0 && (
            <ul className="mt-3 border rounded-xl divide-y max-h-72 overflow-auto">
              {list.map((r: any, i: number) => (
                <li key={`${r.상품명}-${i}`}>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-orange-50 text-lg"
                    onClick={() => {
                      setSelected(r);
                      setQuery(r.상품명);
                    }}
                  >
                    <span className="font-semibold">{r.상품명}</span>
                    {r.보험사 && <span className="text-gray-500"> · {r.보험사}</span>}
                    {r.구분 && <span className="text-gray-500"> · {r.구분}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {rows.length === 0 && <p className="text-sm text-gray-500 mt-2">목록이 안 보이면 기본 데이터를 먼저 불러오세요.</p>}
        </div>

        {/* 금액/지급률/반올림 */}
        <div className="bg-white p-6 rounded-2xl shadow max-w-3xl space-y-5">
          <div>
            <label className="block text-base font-semibold mb-2 text-gray-800">매출 금액 (원)</label>
            <input
              inputMode="numeric"
              value={amount}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, "");
                const withComma = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                setAmount(withComma);
              }}
              placeholder="예: 1,000,000"
              className="w-full border-2 rounded-xl p-3 text-lg"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-base font-semibold text-gray-800">지급률</label>
              <span className="text-base text-gray-700">{payout}%</span>
            </div>
            <input
              type="range"
              min={70}
              max={92}
              step={1}
              value={payout}
              onChange={(e) => setPayout(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex items-center gap-3 mt-3">
              <input
                type="number"
                min={70}
                max={92}
                step={0.5}
                value={payout}
                onChange={(e) => setPayout(Math.max(70, Math.min(92, Number(e.target.value))))}
                className="w-28 border-2 rounded-xl p-2 text-right text-lg"
              />
              <span className="text-base text-gray-700">%</span>
              <div className="flex gap-3 ml-2">
                <button onClick={() => setPayout(70)} className="px-3 py-1.5 text-base rounded-lg bg-gray-100 hover:bg-gray-200">
                  70%
                </button>
                <button onClick={() => setPayout(92)} className="px-3 py-1.5 text-base rounded-lg bg-gray-100 hover:bg-gray-200">
                  92%
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">범위: 70% ~ 92% · 표시 금액은 최종 100원 절사</p>
          </div>
        </div>

        {/* 결과 표 */}
        {selected && detail && (
          <div className="bg-white p-6 rounded-2xl shadow mt-8 max-w-3xl">
            <h3 className="text-xl font-bold mb-3 text-gray-900">
              {selected.상품명}
              {selected.보험사 ? ` · ${selected.보험사}` : ""}
              {selected.구분 ? ` (${selected.구분})` : ""}
            </h3>
            <table className="w-full text-lg border-t">
              <thead className="bg-orange-50">
                <tr>
                  <th className="text-left p-3 border-b">항목</th>
                  <th className="text-left p-3 border-b">지급월/회차</th>
                  <th className="text-right p-3 border-b">수수료율(%)</th>
                  <th className="text-right p-3 border-b">금액(원)</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((it: any) => (
                  <tr key={it.label} title={it.schedule}>
                    <td className="p-3 border-b">{it.label}</td>
                    <td className="p-3 border-b">{it.schedule}</td>
                    <td className="p-3 border-b text-right">{typeof it.pct === "number" ? it.pct : "-"}</td>
                    <td className="p-3 border-b text-right">{calcAmt(it.pct).toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-orange-50 font-bold">
                  <td className="p-3 border-t">총지급</td>
                  <td className="p-3 border-t text-gray-500">—</td>
                  <td className="p-3 border-t text-right">
                    {typeof detail.totalPct === "number" ? detail.totalPct : "-"}
                  </td>
                  <td className="p-3 border-t text-right">{computedTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
