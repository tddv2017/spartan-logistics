"use client";
import { useState, useEffect, useMemo } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function InputForm({ formData, handleChange, handleBlurTime, calculateFees, setFormData }: any) {
    const [tempStartDate, setTempStartDate] = useState("");
    const [tempEndDate, setTempEndDate] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // ─── CAMERA QUÉT QR ───────────────────────────────────────────────────────
    useEffect(() => {
        if (isScanning) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 15, qrbox: { width: 250, height: 250 } },
                false
            );
            scanner.render(
                (decodedText) => { scanner.clear(); setIsScanning(false); processScannedData(decodedText); },
                () => {}
            );
            return () => { scanner.clear().catch(() => {}); };
        }
    }, [isScanning]);

    const processScannedData = (text: string) => {
        let extractedAwb = text;
        try {
            if (text.includes("http")) {
                const url = new URL(text);
                extractedAwb = url.searchParams.get("edo") || url.searchParams.get("code") || text;
            }
            const cleaned = extractedAwb.replace(/[^a-zA-Z0-9]/g, '');
            if (cleaned.startsWith("202") && cleaned.length >= 15) extractedAwb = cleaned.substring(4, 15);
        } catch (e) {}
        setFormData((prev: any) => ({ ...prev, awbNo: extractedAwb }));
    };

    const handlePdfUpload = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const uploadData = new FormData();
        uploadData.append("file", file);
        try {
            const res = await fetch('/api/read-pdf', { method: 'POST', body: uploadData });
            const data = await res.json();
            if (data.success) {
                setFormData((prev: any) => ({ ...prev, awbNo: data.awb }));
                alert(`Đã trích xuất AWB: ${data.awb}`);
            } else { alert("Lỗi: " + data.error); }
        } catch { alert("Lỗi kết nối đến máy chủ đọc PDF!"); }
        finally { setIsUploading(false); e.target.value = null; }
    };

    // ─── QUẢN LÝ LÔ HÀNG ─────────────────────────────────────────────────────
    const parts: any[] = formData.parts || [];

    const totalGross = useMemo(
        () => parts.reduce((s: number, p: any) => s + (parseFloat(p.grossKg) || 0), 0),
        [parts]
    );

    const cwTotal = parseFloat(String(formData.cwInput).replace(',', '.')) || 0;

    const getPartCW = (grossKg: string) => {
        const g = parseFloat(grossKg) || 0;
        if (totalGross <= 0 || cwTotal <= 0 || g <= 0) return null;
        return (g / totalGross) * cwTotal;
    };

    const addPart = () => {
        setFormData((prev: any) => ({
            ...prev,
            parts: [...(prev.parts || []), { id: Date.now().toString(), arrivalDate: '', grossKg: '' }]
        }));
    };

    const removePart = (id: string) => {
        setFormData((prev: any) => ({
            ...prev,
            parts: (prev.parts || []).filter((p: any) => p.id !== id)
        }));
    };

    const updatePart = (id: string, field: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            parts: (prev.parts || []).map((p: any) => p.id === id ? { ...p, [field]: value } : p)
        }));
    };

    // ─── NGÀY LỄ ──────────────────────────────────────────────────────────────
    const addHolidayRange = () => {
        if (!tempStartDate) return alert("Vui lòng chọn ít nhất 'Từ ngày'!");
        let newDates: string[] = [];
        if (!tempEndDate) {
            newDates.push(tempStartDate);
        } else {
            let start = new Date(tempStartDate), end = new Date(tempEndDate);
            if (end < start) return alert("Ngày kết thúc không thể trước ngày bắt đầu!");
            let current = new Date(start);
            while (current <= end) {
                newDates.push(`${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`);
                current.setDate(current.getDate() + 1);
            }
        }
        const cur = formData.holidays || [];
        const unique = newDates.filter((d: string) => !cur.includes(d));
        if (unique.length > 0) handleChange({ target: { name: 'holidays', value: [...cur, ...unique] } });
        setTempStartDate(""); setTempEndDate("");
    };

    const removeHoliday = (dateToRemove: string) => {
        handleChange({ target: { name: 'holidays', value: formData.holidays.filter((d: string) => d !== dateToRemove) } });
    };

    return (
        <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-slate-700 overflow-y-auto bg-slate-900/30">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
                ⚡ SPARTAN LOGISTICS
            </h2>

            {/* AWB */}
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-600 mb-6 shadow-inner">
                <label className="block text-xs font-bold text-sky-400 mb-3 uppercase tracking-widest">
                    Số Không Vận Đơn (AWB)
                </label>
                {isScanning && (
                    <div className="mb-4 bg-black p-2 rounded-xl border-2 border-emerald-500 overflow-hidden relative shadow-2xl">
                        <button onClick={() => setIsScanning(false)} className="absolute top-2 right-2 z-10 bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-lg">ĐÓNG ✕</button>
                        <div id="reader" className="w-full rounded overflow-hidden"></div>
                    </div>
                )}
                <input type="file" id="pdfUploader" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
                <div className="flex gap-2">
                    <button onClick={() => setIsScanning(!isScanning)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-3 rounded-xl transition-all shadow-lg" title="Dùng Camera quét QR">📸</button>
                    <button onClick={() => document.getElementById('pdfUploader')?.click()} disabled={isUploading} className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-600 text-white font-bold py-3 px-3 rounded-xl transition-all shadow-lg" title="Tải file PDF chứa eDO">
                        {isUploading ? '⌛' : '📄'}
                    </button>
                    <input type="text" value={formData.awbNo || ""} onChange={e => setFormData((p: any) => ({ ...p, awbNo: e.target.value }))}
                        placeholder="Nhập tay, quét QR, hoặc tải PDF..."
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-xl p-3 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 font-mono text-xs md:text-sm tracking-widest"
                    />
                </div>
                {formData.awbNo && (
                    <p className="text-[10px] text-emerald-500/70 font-bold mt-2 uppercase tracking-wider pl-1">✓ Mã AWB đã sẵn sàng</p>
                )}
            </div>

            <div className="space-y-5">
                {/* NGÀY GIỜ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ngày/Giờ Đáp (ATA)</label>
                        <div className="flex bg-slate-800 rounded-xl border border-slate-600 overflow-hidden focus-within:border-cyan-500 transition-colors">
                            <input type="date" name="d1Val" value={formData.d1Val || ""} onChange={handleChange} className="bg-transparent p-2.5 text-white focus:outline-none flex-1 [color-scheme:dark] text-sm"/>
                            <input type="text" name="t1Val" value={formData.t1Val || ""} onChange={handleChange} onBlur={handleBlurTime} placeholder="0000" className="bg-slate-700/50 w-16 p-2.5 text-center text-cyan-400 font-mono font-bold border-l border-slate-600 focus:outline-none text-sm"/>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ngày/Giờ Lấy Hàng</label>
                        <div className="flex bg-slate-800 rounded-xl border border-slate-600 overflow-hidden focus-within:border-emerald-500 transition-colors">
                            <input type="date" name="d2Val" value={formData.d2Val || ""} onChange={handleChange} className="bg-transparent p-2.5 text-white focus:outline-none flex-1 [color-scheme:dark] text-sm"/>
                            <input type="text" name="t2Val" value={formData.t2Val || ""} onChange={handleChange} onBlur={handleBlurTime} placeholder="0000" className="bg-slate-700/50 w-16 p-2.5 text-center text-emerald-400 font-mono font-bold border-l border-slate-600 focus:outline-none text-sm"/>
                        </div>
                    </div>
                </div>

                {/* MÃ HÀNG + EXPRESS */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Mã Hàng</label>
                        <select name="code" value={formData.code} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white font-bold focus:border-cyan-500 outline-none text-sm">
                            <option value="GEN">Hàng Thường (GEN)</option>
                            <option value="PER">Hàng Lạnh (PER)</option>
                            <option value="VAL">Giá Trị Cao (VAL)</option>
                            <option value="DGR">Nguy Hiểm (DGR)</option>
                            <option value="AVI">Súc Vật Sống (AVI)</option>
                            <option value="VUN">Hàng Dễ Vỡ (VUN)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">Tốc độ Phục Vụ</label>
                        <select name="express" value={formData.express} onChange={handleChange} className="w-full bg-slate-700 border border-slate-500 rounded-xl p-2.5 text-amber-300 font-bold focus:border-amber-500 outline-none text-sm">
                            <option value="0">Tiêu chuẩn</option>
                            <option value="1">Mức 1 (1.5 - 3H)</option>
                            <option value="2">Mức 2 (3 - 6H)</option>
                            <option value="3">Mức 3 (6 - 9H)</option>
                            <option value="4">Mức 4 (9 - 12H)</option>
                        </select>
                    </div>
                </div>

                {/* GROSS + CW + MST */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Gross (kg)</label>
                        <input type="number" step="0.1" name="grossInput" value={formData.grossInput || ""}
                            onChange={handleChange} placeholder="Gross thực"
                            className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-slate-300 font-bold focus:border-slate-400 outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-cyan-400 uppercase mb-1">Charge Weight (kg)</label>
                        <input type="number" step="0.1" name="cwInput" value={formData.cwInput || ""}
                            onChange={handleChange} placeholder="CW trên eDO"
                            className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-cyan-300 font-bold focus:border-cyan-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-emerald-400 uppercase mb-1">Mã Số Thuế</label>
                        <input type="text" name="taxCode" value={formData.taxCode || ""} onChange={handleChange} placeholder="MST..."
                            className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-emerald-300 font-mono focus:border-emerald-500 outline-none text-sm"
                        />
                    </div>
                </div>

                {/* OT */}
                <div>
                    <label className="block text-[11px] font-bold text-purple-400 uppercase mb-1">Ngoài Giờ (OT)</label>
                    <select name="otSelect" value={formData.otSelect} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white text-sm outline-none focus:border-purple-500">
                        <option value="auto">Tự động (Theo giờ lấy)</option>
                        <option value="0">Không OT (0%)</option>
                        <option value="0.09">Ngoài giờ 17h-22h (9%)</option>
                        <option value="0.18">Khuya 22h-06h (18%)</option>
                        <option value="0.27">Chủ Nhật / Lễ (27%)</option>
                    </select>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    PHÂN BỔ HÀNG VỀ NHIỀU LÔ
                ═══════════════════════════════════════════════════════════ */}
                <div className="p-4 bg-slate-800/50 border border-cyan-900/50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                            📦 Hàng Về Nhiều Lô (Tách Lưu Kho)
                        </label>
                        {parts.length > 0 && (
                            <span className="text-[10px] text-slate-500 font-mono">
                                Gross: <span className="text-white">{totalGross.toFixed(1)}kg</span>
                                {cwTotal > 0 && totalGross > 0 && (
                                    <> | CW: <span className="text-cyan-400">{cwTotal}kg</span></>
                                )}
                            </span>
                        )}
                    </div>

                    {parts.length > 0 && (
                        <>
                            {/* Header */}
                            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 mb-1.5 px-1">
                                <span className="text-[10px] text-slate-600 w-5">#</span>
                                <span className="text-[10px] text-slate-500 uppercase">Ngày Về</span>
                                <span className="text-[10px] text-slate-500 uppercase">Gross (kg)</span>
                                <span className="text-[10px] text-cyan-600 uppercase">CW Qui Đổi</span>
                                <span className="w-5"></span>
                            </div>

                            {/* Rows */}
                            {parts.map((part: any, idx: number) => {
                                const partCW = getPartCW(part.grossKg);
                                return (
                                    <div key={part.id} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 mb-2 items-center">
                                        {/* Index */}
                                        <span className="text-[11px] text-slate-600 font-bold w-5 text-center">{idx + 1}</span>

                                        {/* Ngày về */}
                                        <input
                                            type="date"
                                            value={part.arrivalDate}
                                            onChange={e => updatePart(part.id, 'arrivalDate', e.target.value)}
                                            className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-xs [color-scheme:dark] outline-none focus:border-cyan-500"
                                        />

                                        {/* Gross */}
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={part.grossKg}
                                            onChange={e => updatePart(part.id, 'grossKg', e.target.value)}
                                            placeholder="kg"
                                            className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-xs outline-none focus:border-slate-400"
                                        />

                                        {/* CW qui đổi (auto) */}
                                        <div className={`rounded-lg p-2 text-center text-xs font-mono font-bold border ${
                                            partCW !== null
                                                ? 'bg-cyan-900/20 border-cyan-800/40 text-cyan-400'
                                                : 'bg-slate-900 border-slate-700 text-slate-600'
                                        }`}>
                                            {partCW !== null ? partCW.toFixed(2) : '--'}
                                        </div>

                                        {/* Xóa */}
                                        <button
                                            type="button"
                                            onClick={() => removePart(part.id)}
                                            className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors text-xs"
                                        >✕</button>
                                    </div>
                                );
                            })}

                            {/* Summary bar */}
                            {parts.length > 1 && cwTotal > 0 && totalGross > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-700/50 grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 items-center px-1">
                                    <span className="text-[10px] text-slate-600 w-5"></span>
                                    <span className="text-[10px] text-slate-500">Tổng</span>
                                    <span className="text-[11px] font-bold text-white font-mono">{totalGross.toFixed(1)} kg</span>
                                    <span className="text-[11px] font-bold text-cyan-400 font-mono">{cwTotal} kg</span>
                                    <span className="w-5"></span>
                                </div>
                            )}
                        </>
                    )}

                    <button
                        type="button"
                        onClick={addPart}
                        className="w-full mt-2 bg-cyan-900/10 text-cyan-400 border border-cyan-900/40 font-bold py-2 rounded-lg text-xs hover:bg-cyan-900/30 transition-colors"
                    >
                        + Thêm Lô Hàng
                    </button>

                    {parts.length === 0 && (
                        <p className="text-[10px] text-slate-600 text-center mt-1.5">
                            Nếu hàng về 1 lần → dùng Ngày Đáp bên trên. Thêm lô khi hàng về nhiều ngày.
                        </p>
                    )}
                </div>

                {/* NGÀY LỄ */}
                <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                    <label className="block text-[11px] font-bold text-pink-400 mb-2 uppercase">Cài đặt Ngày Lễ</label>
                    <div className="flex items-center gap-2 mb-3">
                        <input type="date" value={tempStartDate} onChange={e => setTempStartDate(e.target.value)} className="flex-1 bg-slate-900 border border-pink-500/30 rounded-lg p-2 text-white text-xs [color-scheme:dark] outline-none focus:border-pink-500" />
                        <span className="text-slate-500">-</span>
                        <input type="date" value={tempEndDate} onChange={e => setTempEndDate(e.target.value)} className="flex-1 bg-slate-900 border border-pink-500/30 rounded-lg p-2 text-white text-xs [color-scheme:dark] outline-none focus:border-pink-500" />
                    </div>
                    <button type="button" onClick={addHolidayRange} className="w-full bg-pink-600/10 text-pink-400 border border-pink-600/30 font-bold py-2 rounded-lg text-xs hover:bg-pink-600/30 transition-colors">
                        + Thêm Ngày Lễ
                    </button>
                    {formData.holidays?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-700/50">
                            {formData.holidays.sort().map((h: string) => (
                                <span key={h} className="bg-pink-900/40 text-pink-300 border border-pink-700/50 px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1.5">
                                    {h.split('-').reverse().join('/')}
                                    <button type="button" onClick={() => removeHoliday(h)} className="text-pink-400 hover:text-white hover:bg-pink-600 rounded-full w-4 h-4 flex items-center justify-center transition-colors">✕</button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <button onClick={calculateFees} className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-4 px-4 rounded-2xl transition-all shadow-xl shadow-cyan-900/20 uppercase tracking-widest">
                    🔥 XUẤT HÓA ĐƠN & QR
                </button>
            </div>
        </div>
    );
}
