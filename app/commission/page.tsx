'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

/** ================================
 *  엑셀 자동 계산 (정규화 + 지급률별 70·75·80)
 *  ================================ */

export default function CommissionPage() {
  const [data, setData] = useState<any[]>([]);
  const [result, setResult] = useState<any[]>([]);

  // 1️⃣ 엑셀 파일 업로드
  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: 0 });
      setData(rows);
      processExcel(rows);
    };
    reader.readAsBinaryString(file);
  };

  // 2️⃣ 지급률 계산 로직 (96% → 100% 정규화 후, 70·75·80%)
  const processExcel = (rows: any[]) => {
    const normalized = rows.map((row: any) => {
      const baseRate = 0.96;
      const premium = Number(row['보험료'] || row['premium'] || 0);
      const rates = {
        '100%': 1 / baseRate,
        '70%': 0.7 / baseRate,
        '75%': 0.75 / baseRate,
        '80%': 0.8 / baseRate,
      };

      const monthlyRates = {
        초회: parseFloat(row['초회'] || 0),
        '2~12회': parseFloat(row['2~12회'] || 0),
        '2차년도': parseFloat(row['2차년도'] || 0),
        '3차년도': parseFloat(row['3차년도'] || 0),
        '4~10차년도': parseFloat(row['4~10차년도'] || 0),
      };

      const calc = (rate: number) => {
        let total = 0;
        const result: any = {};
        for (const [key, val] of Object.entries(monthlyRates)) {
          const v = Math.floor((premium * (val as number) / 100) * rate / 100) * 100;
          result[key] = v;
          total += v;
        }
        result['합계'] = total;
        return result;
      };

      return {
        상품명: row['상품명'],
        '100%': calc(rates['100%']),
        '70%': calc(rates['70%']),
        '75%': calc(rates['75%']),
        '80%': calc(rates['80%']),
      };
    });
    setResult(normalized);
  };

  // 3️⃣ 출력 테이블
  const renderTable = () => {
    if (result.length === 0) return null;
    return result.map((r: any, i: number) => (
      <div key={i} className="p-4 my-4 border rounded-lg shadow">
        <h2 className="font-bold text-lg mb-2">{r.상품명}</h2>
        <table className="w-full text-sm border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">지급률</th>
              <th className="border p-2">초회</th>
              <th className="border p-2">2차년도</th>
              <th className="border p-2">3차년도</th>
              <th className="border p-2">합계</th>
            </tr>
          </thead>
          <tbody>
            {['100%', '70%', '75%', '80%'].map((rKey) => (
              <tr key={rKey}>
                <td className="border p-2 font-semibold text-center">{rKey}</td>
                <td className="border p-2 text-right">{r[rKey].초회.toLocaleString()}</td>
                <td className="border p-2 text-right">{r[rKey]['2차년도'].toLocaleString()}</td>
                <td className="border p-2 text-right">{r[rKey]['3차년도'].toLocaleString()}</td>
                <td className="border p-2 text-right font-bold text-blue-600">{r[rKey].합계.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ));
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4 text-center">엑셀 자동계산 (70·75·80 지급률)</h1>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="mb-6 border p-2 w-full"
      />
      {renderTable()}
    </div>
  );
}
