"use client";

import React from 'react';

interface InvoiceBoardProps {
    result: any;
    onCopy: () => void;
    awbNo?: string;
    taxCode?: string;
    grossInput?: string;
}

export default function InvoiceBoard({ result, onCopy, awbNo, taxCode, grossInput }: InvoiceBoardProps) {
    const fmt = (num: number) => Math.round(num).toLocaleString('vi-VN') + " VNĐ";
    const fmtKg = (n: number) => n % 1 === 0 ? n.toString() : n.toFixed(2);

    if (!result) return (
        <div className="w-full md:w-1/2 p-8 bg-slate-900/50 flex flex-col justify-center items-center text-slate-500 border-t md:border-t-0">
            <div className="animate-pulse flex flex-col items-center">
                <p className="mb-2 italic text-center">Chưa có dữ liệu tính toán...</p>
                <p className="text-xs uppercase tracking-widest text-slate-600">Spartan Logistics System</p>
            </div>
        </div>
    );

    const config = {
        bankId: "acb",
        accountNo: "189362839",
        accountName: "CONG TY SPARTAN LOGISTICS",
    };

    const memo = `PHI AWB ${awbNo || ""}${taxCode ? ` MST ${taxCode}` : ""}`.toUpperCase();
    const qrUrl = `https://img.vietqr.io/image/${config.bankId}-${config.accountNo}-compact2.png?amount=${Math.round(result.total)}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(config.accountName)}`;

    // Gross hiển thị: từ multi-part → totalGross; từ single → grossInput prop
    const displayGross = result.isMultiPart
        ? result.totalGross
        : (parseFloat(grossInput || '') || null);

    const displayCW = result.isMultiPart ? result.totalCW : null;

    return (
        <div className="w-full md:w-1/2 p-8 bg-slate-900/50 flex flex-col relative border-t md:border-t-0 overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-slate-300 flex items-center gap-2">
                📄 THÔNG TIN CHI TIẾT PHÍ
            </h3>

            <div className="space-y-4">

                {/* ── THÔNG TIN TRỌNG LƯỢNG ── */}
                {(displayGross !== null || displayCW !== null) && (
                    <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 flex gap-4">
                        {displayGross !== null && (
                            <div className="flex-1 text-center">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Gross</p>
                                <p className="text-lg font-bold text-white font-mono">{fmtKg(displayGross)} <span className="text-sm text-slate-400">kg</span></p>
                            </div>
                        )}
                        {displayGross !== null && displayCW !== null && (
                            <div className="w-px bg-slate-700"></div>
                        )}
                        {displayCW !== null && (
                            <div className="flex-1 text-center">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Charge Weight</p>
                                <p className="text-lg font-bold text-cyan-400 font-mono">{fmtKg(displayCW)} <span className="text-sm text-cyan-600">kg</span></p>
                            </div>
                        )}
                        {displayGross === null && displayCW !== null && (
                            <div className="flex-1 text-center">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Charge Weight</p>
                                <p className="text-lg font-bold text-cyan-400 font-mono">{fmtKg(displayCW)} <span className="text-sm text-cyan-600">kg</span></p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── THỜI GIAN LƯU KHO ── */}
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-400">Thời gian lưu kho</p>
                    <p className="text-md font-semibold text-white">{result.daysMsg}</p>
                </div>

                {/* ── PHÍ PHỤC VỤ ── */}
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-slate-400">{result.handLabelText}</span>
                    <span className="font-mono text-amber-400 font-bold">{fmt(result.feeHand)}</span>
                </div>

                {/* ── PHÍ OT ── */}
                {result.feeOT > 0 && (
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                        <span className="text-purple-400">{result.otLabelText}</span>
                        <span className="font-mono text-purple-400">{fmt(result.feeOT)}</span>
                    </div>
                )}

                {/* ── PHÍ ÁP TẢI ── */}
                {result.feeEscort > 0 && (
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                        <span className="text-fuchsia-400">Phí Áp Tải (VAL Escort)</span>
                        <span className="font-mono text-fuchsia-400">{fmt(result.feeEscort)}</span>
                    </div>
                )}

                {/* ── PHÍ LƯU KHO ── */}
                <div className="flex flex-col border-b border-slate-700 pb-2">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400">
                            Phí Lưu Kho
                            {result.isMultiPart && result.parts?.length > 0 && (
                                <span className="ml-1.5 text-[10px] text-cyan-700 bg-cyan-900/30 px-1.5 py-0.5 rounded font-bold">
                                    {result.parts.length} lô
                                </span>
                            )}
                        </span>
                        <span className="font-mono text-white">{fmt(result.feeStor)}</span>
                    </div>

                    {/* SINGLE PART: breakdown cũ */}
                    {!result.isMultiPart && result.breakdown && result.breakdown.length > 0 && (
                        <div className="ml-4 pl-2 border-l-2 border-slate-600 text-[11px] font-mono text-slate-400 leading-tight">
                            {result.breakdown.map((item: any, idx: number) => (
                                <div key={idx} className={`${item.isGreen ? 'text-green-400 font-bold' : ''} ${item.isWarn ? 'text-amber-500 mt-1' : ''} ${item.isTitle ? 'text-cyan-400 mt-1 mb-1 font-bold border-b border-slate-800' : ''}`}>
                                    {item.text}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* MULTI PART: từng lô */}
                    {result.isMultiPart && result.parts && result.parts.length > 0 && (
                        <div className="space-y-2 mt-1">
                            {result.parts.map((part: any, idx: number) => (
                                <div key={idx} className="bg-slate-900/60 rounded-xl border border-slate-700/60 overflow-hidden">
                                    {/* Part header */}
                                    <div className="flex items-start justify-between p-3 pb-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] font-black text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded">
                                                    Lô {idx + 1}
                                                </span>
                                                <span className="text-[11px] font-bold text-white">
                                                    {part.arrivalDate.split('-').reverse().join('/')}
                                                </span>
                                            </div>
                                            {/* Gross → CW */}
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-[10px] text-slate-500">Gross</span>
                                                <span className="text-[11px] font-bold text-white font-mono">{fmtKg(part.grossKg)}kg</span>
                                                <span className="text-slate-600 text-[10px]">→</span>
                                                <span className="text-[10px] text-slate-500">CW</span>
                                                <span className="text-[11px] font-bold text-cyan-400 font-mono">{fmtKg(part.cwPart)}kg</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-mono font-bold text-white">{fmt(part.feeStor)}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">{part.daysMsg}</div>
                                        </div>
                                    </div>
                                    {/* Part breakdown */}
                                    {part.breakdown && part.breakdown.length > 0 && (
                                        <div className="px-3 pb-2.5 pt-0 border-t border-slate-800">
                                            <div className="pl-2 border-l-2 border-slate-700 text-[10px] font-mono text-slate-500 leading-relaxed mt-1.5">
                                                {part.breakdown.map((item: any, i: number) => (
                                                    <div key={i} className={`${item.isGreen ? 'text-green-400 font-bold' : ''} ${item.isWarn ? 'text-amber-500' : ''} ${item.isTitle ? 'text-cyan-500 font-bold mt-0.5' : ''}`}>
                                                        {item.text}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Summary bar */}
                            {result.parts.length > 1 && (
                                <div className="flex justify-between items-center px-1 pt-1 text-[11px]">
                                    <span className="text-slate-600">
                                        Tổng Gross: <span className="text-slate-400">{fmtKg(result.totalGross)}kg</span>
                                        <span className="mx-1.5 text-slate-700">|</span>
                                        Tổng CW: <span className="text-cyan-600">{fmtKg(result.totalCW)}kg</span>
                                    </span>
                                    <span className="font-mono font-bold text-white">{fmt(result.feeStor)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── VAT ── */}
                <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400 text-sm">Thuế VAT (8%)</span>
                    <span className="font-mono text-slate-400 text-sm">{fmt(result.vat)}</span>
                </div>

                {/* ── TỔNG CỘNG ── */}
                <div className="p-4 bg-cyan-900/40 rounded-lg border border-cyan-800 flex justify-between items-center shadow-lg shadow-cyan-900/20">
                    <span className="text-cyan-400 font-bold uppercase tracking-tight">Tổng Cộng</span>
                    <span className="text-2xl font-bold text-cyan-400 font-mono tracking-tighter">{fmt(result.total)}</span>
                </div>

                {/* ── QR THANH TOÁN ── */}
                <div className="mt-6 p-4 bg-white rounded-xl flex flex-col items-center shadow-2xl relative group">
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded font-bold">VietQR</div>
                    <p className="text-[10px] font-black text-slate-900 mb-2 uppercase tracking-tighter">Quét mã chuyển khoản qua App Ngân hàng</p>
                    <img src={qrUrl} alt="Mã thanh toán QR" className="w-full max-w-[220px] h-auto rounded-sm border border-slate-100" />
                    <div className="mt-3 text-center">
                        <p className="text-[10px] font-bold text-slate-800 leading-none">{config.accountName}</p>
                        <p className="text-[10px] text-blue-700 font-mono font-bold mt-1 uppercase tracking-widest">{config.bankId.toUpperCase()}: {config.accountNo}</p>
                    </div>
                </div>

                {/* ── COPY ── */}
                <button onClick={onCopy} className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy Hóa Đơn (Gửi Zalo)
                </button>
            </div>
        </div>
    );
}
