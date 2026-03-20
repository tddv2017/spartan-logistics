"use client";

export default function InvoiceBoard({ result, onCopy }) {
    const formatMoney = (num) => Math.round(num).toLocaleString('vi-VN') + " VNĐ";

    if (!result) return (
        <div className="w-full md:w-1/2 p-8 bg-slate-900/50 flex flex-col justify-center items-center text-slate-500">
            <p>Nhập thông tin bên trái để xem kết quả tính toán</p>
        </div>
    );

    return (
        <div className="w-full md:w-1/2 p-8 bg-slate-900/50 flex flex-col justify-center relative">
            <h3 className="text-xl font-bold mb-6 text-slate-300">📄 THÔNG TIN CHI TIẾT PHÍ</h3>
            
            <div className="space-y-4">
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-400">Thời gian lưu kho</p>
                    <p className="text-md font-semibold text-white">{result.daysMsg}</p>
                </div>

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

                <div className="flex flex-col border-b border-slate-700 pb-2">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">Phí Lưu Kho</span>
                        <span className="font-mono text-white">{formatMoney(result.feeStor)}</span>
                    </div>
                    {result.breakdown.length > 0 && (
                        <div className="mt-2 ml-4 pl-2 border-l-2 border-slate-600 text-sm font-mono text-slate-400">
                            {result.breakdown.map((item, idx) => (
                                <div key={idx} className={`${item.isGreen ? 'text-green-400 font-bold' : ''} ${item.isWarn ? 'text-amber-500 mt-1' : ''} ${item.isTitle ? 'text-cyan-400 mt-1 mb-1 font-bold' : ''}`}>
                                    {item.text}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-400 text-sm">Thuế VAT (8%)</span>
                    <span className="font-mono text-slate-400 text-sm">{formatMoney(result.vat)}</span>
                </div>

                <div className="p-4 bg-cyan-900/40 rounded-lg border border-cyan-800 mt-4 flex justify-between items-center">
                    <span className="text-cyan-400 font-bold">TỔNG CỘNG</span>
                    <span className="text-2xl font-bold text-cyan-400 font-mono">{formatMoney(result.total)}</span>
                </div>

                <button onClick={onCopy} className="w-full mt-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                    Copy Hóa Đơn (Gửi Zalo)
                </button>
            </div>
        </div>
    );
}