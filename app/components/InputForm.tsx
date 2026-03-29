"use client";
import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function InputForm({ formData, handleChange, handleBlurTime, calculateFees, setFormData }: any) {
    const [tempStartDate, setTempStartDate] = useState("");
    const [tempEndDate, setTempEndDate] = useState("");
    
    // State cho tính năng Tra Cứu SCSC
    const [scscId, setScscId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [trackingInfo, setTrackingInfo] = useState<any>(null);
    
    // State cho Máy quét QR
    const [isScanning, setIsScanning] = useState(false);

    // Kích hoạt Camera khi bấm nút Quét
    useEffect(() => {
        if (isScanning) {
            const scanner = new Html5QrcodeScanner(
                "reader", 
                { fps: 10, qrbox: { width: 250, height: 250 } }, 
                false
            );

            scanner.render(
                (decodedText) => {
                    // Khi quét thành công -> Tắt camera và xử lý dữ liệu
                    scanner.clear();
                    setIsScanning(false);
                    processScannedData(decodedText);
                },
                (error) => {
                    // Bỏ qua các lỗi khung hình trống
                }
            );

            // Dọn dẹp camera khi đóng Component
            return () => {
                scanner.clear().catch(e => console.log("Clear scanner error", e));
            };
        }
    }, [isScanning]);

    // HÀM "BỘ NÃO" TRÍCH XUẤT AWB TỪ MÃ QR CỦA SCSC
    const processScannedData = (text: string) => {
        let extractedAwb = text;
        try {
            // Trường hợp 1: QR là 1 đường link (VD: https://ecargo.scsc.vn/...edo=202602000984524...)
            if (text.includes("http")) {
                const url = new URL(text);
                const edoParam = url.searchParams.get("edo") || url.searchParams.get("id");
                if (edoParam) extractedAwb = edoParam;
            }
            
            // Trường hợp 2: Bóc tách mã eDO dài (VD: 202602000984524CGN32016055)
            const cleaned = extractedAwb.replace(/[^a-zA-Z0-9]/g, '');
            // Nhận diện chuẩn: Năm (4 số đầu) + AWB (11 số tiếp theo)
            if (cleaned.startsWith("202") && cleaned.length >= 15) {
                extractedAwb = cleaned.substring(4, 15); 
            }
        } catch (e) {
            console.log("QR không phải dạng chuẩn SCSC, dùng giá trị gốc.");
        }
        
        console.log("Mã bóc tách được từ QR:", extractedAwb);
        setScscId(extractedAwb);
        handleFetchSCSC(extractedAwb); // Chạy tự động luôn không cần bấm
    };

    // Hàm tra cứu SCSC (Đã nâng cấp để nhận biến truyền vào)
    const handleFetchSCSC = async (idToFetch?: string) => {
        const targetId = idToFetch || scscId;
        if (!targetId) return alert("Vui lòng nhập ID SCSC hoặc Quét mã!");
        
        setIsLoading(true);
        setTrackingInfo(null);
        
        try {
            const res = await fetch(`/api/scsc?id=${targetId}`);
            const data = await res.json();
            
            if (data.success) {
                setTrackingInfo({ ...data, id: targetId }); 
                
                // Bơm trực tiếp vào State tổng
                setFormData((prev: any) => ({
                    ...prev,
                    cwInput: data.weight,   
                    d1Val: data.dateIn,     
                    t1Val: data.timeIn,     
                    awbNo: data.flight || targetId 
                }));
            } else {
                alert("Lỗi: " + data.error);
            }
        } catch (error) {
            alert("Không thể kết nối với máy chủ!");
        } finally {
            setIsLoading(false);
        }
    };

    // ... (Giữ nguyên các hàm addHolidayRange, removeHoliday như cũ) ...
    const addHolidayRange = () => { /* ... */ };
    const removeHoliday = (dateToRemove: string) => { /* ... */ };

    return (
        <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-slate-700 overflow-y-auto bg-slate-900/30">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
                ⚡ SPARTAN LOGISTICS
            </h2>
            
            {/* KHUNG TRA CỨU & QUÉT MÃ QR */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-600 mb-6 shadow-inner">
                <label className="block text-xs font-bold text-sky-400 mb-2 uppercase tracking-widest">Tra cứu hoặc Quét mã eDO</label>
                
                {/* Nút bật tắt Camera */}
                {isScanning && (
                    <div className="mb-4 bg-black p-2 rounded-lg border-2 border-emerald-500 overflow-hidden relative">
                        <button onClick={() => setIsScanning(false)} className="absolute top-2 right-2 z-10 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">Đóng ✕</button>
                        <div id="reader" className="w-full"></div>
                    </div>
                )}

                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsScanning(!isScanning)} 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center shadow-lg"
                        title="Quét mã QR từ giấy eDO"
                    >
                        📸 QR
                    </button>
                    <input 
                        type="text" 
                        value={scscId} 
                        onChange={(e) => setScscId(e.target.value)} 
                        placeholder="Nhập ID/AWB..." 
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500 font-mono text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchSCSC()}
                    />
                    <button 
                        onClick={() => handleFetchSCSC()} 
                        disabled={isLoading}
                        className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 text-white font-bold py-2 px-5 rounded-xl transition-colors shadow-lg"
                    >
                        {isLoading ? '...' : 'Kéo'}
                    </button>
                </div>

                {trackingInfo && (
                    <div className="mt-4 p-3 bg-slate-900/80 rounded-xl border border-slate-700 text-sm">
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[12px]">
                            <div><span className="text-slate-500">Chuyến bay:</span> <span className="text-white font-bold">{trackingInfo.flight}</span></div>
                            <div><span className="text-slate-500">Số kiện:</span> <span className="text-white">{trackingInfo.pieces}</span></div>
                            <div><span className="text-slate-500">Charge Wgt:</span> <span className="text-amber-400 font-bold">{trackingInfo.weight} kg</span></div>
                            <div><span className="text-slate-500">Ngày đáp:</span> <span className="text-cyan-400">{trackingInfo.rawAta}</span></div>
                        </div>
                        <div className="mt-3 text-[10px] text-sky-400 text-center font-bold bg-sky-900/20 py-1.5 rounded-lg border border-sky-800/30">
                            ✓ Đã điền Số Kg và Ngày Giờ Đáp
                        </div>
                    </div>
                )}
            </div>

            {/* FORM TÍNH TIỀN CHÍNH (Dán lại phần Form UI MỚI tao đã gửi ở bước trước vào đây) */}
            <div className="space-y-5">
                {/* --- UI CHỌN NGÀY GIỜ MỚI --- */}
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

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Mã Hàng</label>
                        <select name="code" value={formData.code} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white font-bold focus:border-cyan-500 outline-none text-sm">
                            <option value="GEN">Hàng Thường (GEN)</option>
                            <option value="PER">Hàng Lạnh (PER)</option>
                            <option value="VAL">Giá Trị Cao (VAL)</option>
                            <option value="DGR">Nguy Hiểm (DGR)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">Tốc độ Phục Vụ</label>
                        <select name="express" value={formData.express} onChange={handleChange} className="w-full bg-slate-700 border border-slate-500 rounded-xl p-2.5 text-amber-300 font-bold focus:border-amber-500 outline-none text-sm">
                            <option value="0">Tiêu chuẩn</option>
                            <option value="1">Mức 1 (1.5 - 3H)</option>
                            <option value="2">Mức 2 (3 - 6H)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] font-bold text-cyan-400 uppercase mb-1">Charge Weight (kg)</label>
                        <input type="number" step="0.1" name="cwInput" value={formData.cwInput || ""} onChange={handleChange} placeholder="VD: 212.5" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-cyan-300 font-bold focus:border-cyan-500 outline-none"/>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-emerald-400 uppercase mb-1">Mã Số Thuế (Tùy chọn)</label>
                        <input type="text" name="taxCode" value={formData.taxCode || ""} onChange={handleChange} placeholder="Nhập MST..." className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-emerald-300 font-mono focus:border-emerald-500 outline-none text-sm"/>
                    </div>
                </div>

                <div className="grid grid-cols-1">
                    <label className="block text-[11px] font-bold text-purple-400 uppercase mb-1">Ngoài Giờ (OT)</label>
                    <select name="otSelect" value={formData.otSelect} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white text-sm outline-none focus:border-purple-500">
                        <option value="auto">Tự động (Theo giờ lấy)</option>
                        <option value="0">Không OT (0%)</option>
                        <option value="0.27">Chủ Nhật / Lễ (27%)</option>
                    </select>
                </div>

                <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                    <label className="block text-[11px] font-bold text-pink-400 mb-2 uppercase">Cài đặt Ngày Lễ Toàn Hệ Thống</label>
                    <div className="flex items-center gap-2 mb-3">
                        <input type="date" value={tempStartDate} onChange={(e) => setTempStartDate(e.target.value)} className="flex-1 bg-slate-900 border border-pink-500/30 rounded-lg p-2 text-white text-xs [color-scheme:dark] outline-none focus:border-pink-500" />
                        <span className="text-slate-500">-</span>
                        <input type="date" value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} className="flex-1 bg-slate-900 border border-pink-500/30 rounded-lg p-2 text-white text-xs [color-scheme:dark] outline-none focus:border-pink-500" />
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

                <button onClick={calculateFees} className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-4 px-4 rounded-2xl transition-all shadow-xl shadow-cyan-900/20 uppercase tracking-widest mt-4">
                    🔥 XUẤT HÓA ĐƠN & QR
                </button>
            </div>
        </div>
    );
}