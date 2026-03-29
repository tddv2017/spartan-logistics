"use client";

import React from 'react';

interface InvoiceBoardProps {
    result: any;
    onCopy: () => void;
    awbNo?: string;     // Số AWB lấy từ SCSC
    taxCode?: string;   // Mã số thuế (nếu mày muốn khách ghi chú thêm)
}

export default function InvoiceBoard({ result, onCopy, awbNo, taxCode }: InvoiceBoardProps) {
    const formatMoney = (num: number) => Math.round(num).toLocaleString('vi-VN') + " VNĐ";

    if (!result) return (
        <div className="w-full md:w-1/2 p-8 bg-slate-900/50 flex flex-col justify-center items-center text-slate-500 border-t md:border-t-0">
            <div className="animate-pulse flex flex-col items-center">
                <p className="mb-2 italic text-center">Chưa có dữ liệu tính toán...</p>
                <p className="text-xs uppercase tracking-widest text-slate-600">Spartan Logistics System</p>
            </div>
        </div>
    );

    // --- CẤU HÌNH VIETQR (THAY THÔNG TIN CỦA MÀY TẠI ĐÂY) ---
    const config = {
        bankId: "acb", // vcb, mbb, tcb, acb, vtb...
        accountNo: "189362839", // SỐ TÀI KHOẢN CỦA MÀY
        accountName: "CONG TY SPARTAN LOGISTICS", // Tên viết hoa không dấu
    };

    // Tạo nội dung chuyển khoản: PHI AWB 61851448692
    const memo = `PHI AWB ${awbNo || ""}${taxCode ? ` MST ${taxCode}` : ""}`.toUpperCase();
    
    // Link API VietQR (Dùng template compact2 cho gọn giao diện)
    const qrUrl = `https://img.vietqr.io/image/${config.bankId}-${config.accountNo}-compact2.png?amount=${Math.round(result.total)}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(config.accountName)}`;

    return (
        <div className="w-full md:w-1/2 p-8 bg-slate-900/50 flex flex-col relative border-t md:border-t-0 overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-slate-300 flex items-center gap-2">
                📄 THÔNG TIN CHI TIẾT PHÍ
            </h3>
            
            <div className="space-y-4">
                {/* 1. Thông tin lưu kho */}
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-400">Thời gian lưu kho</p>
                    <p className="text-md font-semibold text-white">{result.daysMsg}</p>
                </div>

                {/* 2. Chi tiết các loại phí */}
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-slate-400">{result.handLabelText}</span>
                    <span className="font-mono text-amber-400 font-bold">{formatMoney(result.feeHand)}</span>
                </div>

                {result.feeOT > 0 && (
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                        <span className="text-purple-400">{result.otLabelText}</span>
                        <span className="font-mono text-purple-400">{formatMoney(result.feeOT)}</span>
                    </div>
                )}

                {result.feeEscort > 0 && (
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                        <span className="text-fuchsia-400">Phí Áp Tải (VAL Escort)</span>
                        <span className="font-mono text-fuchsia-400">{formatMoney(result.feeEscort)}</span>
                    </div>
                )}

                {/* 3. Breakdown Phí lưu kho (Nếu có) */}
                <div className="flex flex-col border-b border-slate-700 pb-2">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">Phí Lưu Kho</span>
                        <span className="font-mono text-white">{formatMoney(result.feeStor)}</span>
                    </div>
                    {result.breakdown && result.breakdown.length > 0 && (
                        <div className="mt-2 ml-4 pl-2 border-l-2 border-slate-600 text-[11px] font-mono text-slate-400 leading-tight">
                            {result.breakdown.map((item: any, idx: number) => (
                                <div key={idx} className={`${item.isGreen ? 'text-green-400 font-bold' : ''} ${item.isWarn ? 'text-amber-500 mt-1' : ''} ${item.isTitle ? 'text-cyan-400 mt-1 mb-1 font-bold border-b border-slate-800' : ''}`}>
                                    {item.text}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400 text-sm">Thuế VAT (8%)</span>
                    <span className="font-mono text-slate-400 text-sm">{formatMoney(result.vat)}</span>
                </div>

                {/* 4. Tổng cộng */}
                <div className="p-4 bg-cyan-900/40 rounded-lg border border-cyan-800 flex justify-between items-center shadow-lg shadow-cyan-900/20">
                    <span className="text-cyan-400 font-bold uppercase tracking-tight">Tổng Cộng</span>
                    <span className="text-2xl font-bold text-cyan-400 font-mono tracking-tighter">{formatMoney(result.total)}</span>
                </div>

                {/* 5. MÃ QR THANH TOÁN (VIETQR) */}
                <div className="mt-6 p-4 bg-white rounded-xl flex flex-col items-center shadow-2xl relative group">
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded font-bold">VietQR</div>
                    <p className="text-[10px] font-black text-slate-900 mb-2 uppercase tracking-tighter">Quét mã chuyển khoản qua App Ngân hàng</p>
                    
                    <img 
                        src={qrUrl} 
                        alt="Mã thanh toán QR" 
                        className="w-full max-w-[220px] h-auto rounded-sm border border-slate-100"
                    />
                    
                    <div className="mt-3 text-center">
                        <p className="text-[10px] font-bold text-slate-800 leading-none">{config.accountName}</p>
                        <p className="text-[10px] text-blue-700 font-mono font-bold mt-1 uppercase tracking-widest">{config.bankId.toUpperCase()}: {config.accountNo}</p>
                    </div>
                </div>

                {/* 6. Nút Copy */}
                <button 
                    onClick={onCopy} 
                    className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy Hóa Đơn (Gửi Zalo)
                </button>
            </div>
        </div>
    );
}