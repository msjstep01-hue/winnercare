"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { useDropzone } from "react-dropzone";

type WizardProps = {
  open: boolean;
  onClose: () => void;
  carrier: {
    id: string;
    name: string;
    fax?: string;
    template?: string;
    fieldMap?: Record<string, string>;
  } | null;
};

export default function ClaimWizard({ open, onClose, carrier }: WizardProps) {
  // 보험사/팩스 자동 프리필
  const [insurer, setInsurer] = useState("");
  const [fax, setFax] = useState("");

  // 청구 폼
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    insuredName: "",
    birth: "",
    policyNo: "",
    accidentDate: "",
    bankName: "",
    bankAcct: "",
    memo: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [signDataUrl, setSignDataUrl] = useState<string>("");

  // 서명 패드
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (canvasRef.current && !sigRef.current) {
      sigRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: "rgb(255,255,255)",
      });
    }
  }, []);

  // 모달 열릴 때 carrier 값으로 프리필
  useEffect(() => {
    if (!open || !carrier) return;
    setInsurer(carrier.name ?? "");
    setFax(carrier.fax ?? "");
  }, [open, carrier]);

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (open) return;
    sigRef.current?.clear();
    setSignDataUrl("");
    setFiles([]);
    setInsurer("");
    setFax("");
    setForm({
      customerName: "",
      phone: "",
      insuredName: "",
      birth: "",
      policyNo: "",
      accidentDate: "",
      bankName: "",
      bankAcct: "",
      memo: "",
    });
  }, [open]);

  // 드래그&드롭
  const onDrop = (accepted: File[]) => setFiles((prev) => [...prev, ...accepted]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "application/pdf": [] },
  });

  // 서명 제어
  const clearSign = () => sigRef.current?.clear();
  const saveSign = () => setSignDataUrl(sigRef.current?.toDataURL("image/png") || "");

  // 제출 (백엔드 연결 전까지는 UX 확인용)
  const submit = async () => {
    if (!carrier) return alert("보험사를 선택하세요.");
    if (!fax || fax.trim() === "")
      return alert("팩스번호를 입력하세요. (없으면 '가상팩스번호 발급요망' 입력)");

    if (!signDataUrl) return alert("서명을 입력 후 ‘서명 저장’ 버튼을 눌러주세요.");

    // TODO: 실제 API 연결 시 /api/fax/send 구현
    alert(
      `가상 전송\n\n보험사: ${insurer}\n팩스: ${fax}\n파일개수: ${files.length}개\n서명: ${
        signDataUrl ? "있음" : "없음"
      }`
    );
    onClose();
  };

  if (!open || !carrier) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-orange-600">
            {carrier.name} 보험금청구
          </h3>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            닫기
          </button>
        </div>

        {/* 보험사/팩스 프리필 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="보험사" v={insurer} s={setInsurer} />
          <Field label="보험금청구 팩스번호" v={fax} s={setFax} />
        </div>

        {/* 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="고객명" v={form.customerName} s={(v) => setForm((f) => ({ ...f, customerName: v }))} />
          <Field label="연락처" v={form.phone} s={(v) => setForm((f) => ({ ...f, phone: v }))} />
          <Field label="피보험자" v={form.insuredName} s={(v) => setForm((f) => ({ ...f, insuredName: v }))} />
          <Field label="생년월일(YYYYMMDD)" v={form.birth} s={(v) => setForm((f) => ({ ...f, birth: v }))} />
          <Field label="증권번호" v={form.policyNo} s={(v) => setForm((f) => ({ ...f, policyNo: v }))} />
          <Field label="사고일자(YYYY-MM-DD)" v={form.accidentDate} s={(v) => setForm((f) => ({ ...f, accidentDate: v }))} />
          <Field label="은행명" v={form.bankName} s={(v) => setForm((f) => ({ ...f, bankName: v }))} />
          <Field label="계좌번호" v={form.bankAcct} s={(v) => setForm((f) => ({ ...f, bankAcct: v }))} />
        </div>

        {/* 메모 */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">메모</label>
          <textarea
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            className="w-full border rounded-lg p-2"
            rows={3}
          />
        </div>

        {/* 서명 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">전자 서명</label>
            <div className="flex gap-2">
              <button onClick={clearSign} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">지우기</button>
              <button onClick={saveSign} className="px-2 py-1 rounded bg-orange-500 text-white">서명 저장</button>
            </div>
          </div>
          <div className="border rounded-lg bg-white">
            <canvas ref={canvasRef} width={800} height={200} className="w-full" />
          </div>
        </div>

        {/* 드래그&드롭 */}
        <Drop
          files={files}
          setFiles={setFiles}
          isDragActive={isDragActive}
          getRootProps={getRootProps}
          getInputProps={getInputProps}
        />

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            선택 보험사: <b>{insurer}</b> · 팩스: <b>{fax || "-"}</b>
          </div>
          <button
            onClick={submit}
            className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700"
          >
            팩스 전송
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, v, s }: { label: string; v: string; s: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
      <input value={v} onChange={(e) => s(e.target.value)} className="w-full border rounded-lg p-2" />
    </div>
  );
}
function Drop({ files, setFiles, isDragActive, getRootProps, getInputProps }: any) {
  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-6 text-center ${
        isDragActive ? "border-orange-400 bg-orange-50" : "border-gray-300"
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-sm text-gray-600">여기에 청구서류(PDF/이미지)를 드래그하거나 클릭하여 선택하세요.</p>
      {files.length > 0 && (
        <ul className="mt-3 text-sm text-gray-700 text-left max-h-28 overflow-auto">
          {files.map((f: File, i: number) => (
            <li key={i}>• {f.name} ({Math.round(f.size / 1024)} KB)</li>
          ))}
        </ul>
      )}
    </div>
  );
}
