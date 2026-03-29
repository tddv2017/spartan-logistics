"use client";
import { useState } from 'react';

export default function InputForm({ formData, handleChange, handleBlurTime, calculateFees, setFormData }: any) {
    const [tempStartDate, setTempStartDate] = useState("");
    const [tempEndDate, setTempEndDate] = useState("");
    
    // State cho tính năng Tra Cứu SCSC
    const [scscId, setScscId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [trackingInfo, setTrackingInfo] = useState<any>(null);

    const handleFetchSCSC = async () => {
        if (!scscId) return alert("Vui lòng nhập ID SCSC!");
        setIsLoading(true);
        setTrackingInfo(null);
        
        try {
            const res = await fetch(`/api/scsc?id=${scscId}`);
            const data = await res.json();
            
            if (data.success) {
                setTrackingInfo(data);
                
                // --- FIX LỖI TỰ ĐIỀN: Bơm trực tiếp vào State tổng ---
                setFormData((prev: any) => ({
                    ...prev,
                    cwInput: data.weight,   // Số kg
                    d1Val: data.dateIn,     // Ngày đáp
                    t1Val: data.timeIn,     // Giờ đáp
                }));
                
                console.log("Auto-fill nổ máy thành công!");
            } else {
                alert("Lỗi: " + data.error);
            }
        } catch (error) {
            alert("Không thể kết nối với máy chủ!");
        } finally {
            setIsLoading(false);
        }
    };

    const addHolidayRange = () => {
        if (!tempStartDate) return alert("Vui lòng chọn ít nhất 'Từ ngày' để thêm Lễ!");
        let newDates: string[] = [];
        if (!tempEndDate) {
            newDates.push(tempStartDate);
        } else {
            let start = new Date(tempStartDate);
            let end = new Date(tempEndDate);
            if (end < start) return alert("Ngày kết thúc không thể trước ngày bắt đầu!");
            let current = new Date(start);
            while (current <= end) {
                const yyyy = current.getFullYear();
                const mm = String(current.getMonth() + 1).padStart(2, '0');
                const dd = String(current.getDate()).padStart(2, '0');
                newDates.push(`${yyyy}-${mm}-${dd}`);
                current.setDate(current.getDate() + 1);
            }
        }
        const currentHolidays = formData.holidays || [];
        const uniqueNewDates = newDates.filter(d => !currentHolidays.includes(d));
        if (uniqueNewDates.length > 0) {
            handleChange({ target: { name: 'holidays', value: [...currentHolidays, ...uniqueNewDates] } });
        }
        setTempStartDate(""); setTempEndDate("");
    };

    const removeHoliday = (dateToRemove: string) => {
        handleChange({ target: { name: 'holidays', value: formData.holidays.filter((d: string) => d !== dateToRemove) } });
    };

    return (
        <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-slate-700 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
                ⚡ SPARTAN LOGISTICS
            </h2>
            
            {/* 1. KHUNG TRA CỨU SCSC */}
            <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-600 mb-6 shadow-inner">
                <label className="block text-sm font-bold text-sky-400 mb-2">Tra cứu lô hàng SCSC (Nhập ID / AWB)</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={scscId} 
                        onChange={(e) => setScscId(e.target.value)} 
                        placeholder="VD: 34925530" 
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500 font-mono"
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchSCSC()}
                    />
                    <button 
                        onClick={handleFetchSCSC} 
                        disabled={isLoading}
                        className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center"
                    >
                        {isLoading ? 'Đang kéo...' : 'Tra cứu'}
                    </button>
                </div>

                {trackingInfo && (
                    <div className="mt-4 p-3 bg-slate-900 rounded border border-slate-700 text-sm">
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[13px]">
                            <div><span className="text-slate-500">Chuyến bay:</span> <span className="text-white font-bold">{trackingInfo.flight}</span></div>
                            <div><span className="text-slate-500">Số kiện:</span> <span className="text-white">{trackingInfo.pieces}</span></div>
                            <div><span className="text-slate-500">Charge Weight:</span> <span className="text-amber-400 font-bold">{trackingInfo.weight} kg</span></div>
                            <div><span className="text-slate-500">Ngày đáp:</span> <span className="text-cyan-400">{trackingInfo.rawAta}</span></div>
                        </div>
                        <div className="mt-3 text-[11px] text-sky-400 text-center font-bold bg-sky-900/30 py-1 rounded">
                            Đã tự động điền Số Kg và Giờ Đáp vào Form! ↓
                        </div>
                    </div>
                )}
            </div>

            {/* 2. FORM TÍNH TIỀN CHÍNH */}
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Mã Hàng</label>
                        <select name="code" value={formData.code} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white font-bold focus:border-cyan-500">
                            <option value="GEN">GEN - Thường</option>
                            <option value="PER">PER - Lạnh</option>
                            <option value="DGR">DGR - Nguy hiểm</option>
                            <option value="AVI">AVI - Động vật</option>
                            <option value="VAL">VAL - Giá trị cao</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-amber-400 mb-1">Tốc độ Phục Vụ</label>
                        <select name="express" value={formData.express} onChange={handleChange} className="w-full bg-slate-700 border border-slate-500 rounded-lg p-3 text-amber-300 font-bold focus:border-amber-500">
                            <option value="0">Tiêu chuẩn</option>
                            <option value="1">Mức 1 (1.5 - 3H)</option>
                            <option value="2">Mức 2 (3 - 6H)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Ngày đáp</label>
                        <input type="date" name="d1Val" value={formData.d1Val || ""} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white [color-scheme:dark]"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Giờ đáp</label>
                        <input type="text" name="t1Val" value={formData.t1Val || ""} onChange={handleChange} onBlur={handleBlurTime} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white font-mono text-center"/>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Ngày lấy</label>
                        <input type="date" name="d2Val" value={formData.d2Val || ""} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white [color-scheme:dark]"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Giờ lấy</label>
                        <input type="text" name="t2Val" value={formData.t2Val || ""} onChange={handleChange} onBlur={handleBlurTime} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white font-mono text-center"/>
                    </div>
                </div>

                {/* DÒNG NÀY THÊM MỚI: CHARGE WEIGHT VÀ MÃ SỐ THUẾ */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-cyan-400 mb-1">Charge Weight (kg)</label>
                        <input type="number" step="0.1" name="cwInput" value={formData.cwInput || ""} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-cyan-300 font-bold"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-emerald-400 mb-1">Mã Số Thuế (MST)</label>
                        <input 
                            type="text" 
                            name="taxCode" 
                            value={formData.taxCode || ""} 
                            onChange={handleChange} 
                            placeholder="Nhập MST để xuất bill"
                            className="w-full bg-slate-800 border border-emerald-600/50 rounded-lg p-3 text-emerald-300 font-mono focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1">
                    <label className="block text-sm font-medium text-purple-400 mb-1">Ngoài Giờ (OT)</label>
                    <select name="otSelect" value={formData.otSelect} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white">
                        <option value="auto">Tự động (Theo giờ lấy)</option>
                        <option value="0">Không OT (0%)</option>
                        <option value="0.27">Chủ Nhật / Lễ (27%)</option>
                    </select>
                </div>

                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <label className="block text-sm font-medium text-pink-400 mb-2">Cài đặt Ngày Lễ</label>
                    <div className="flex items-center gap-2 mb-2">
                        <input type="date" value={tempStartDate} onChange={(e) => setTempStartDate(e.target.value)} className="flex-1 bg-slate-800 border border-pink-500/50 rounded-lg p-2 text-white text-xs [color-scheme:dark]" />
                        <span className="text-slate-500">-</span>
                        <input type="date" value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} className="flex-1 bg-slate-800 border border-pink-500/50 rounded-lg p-2 text-white text-xs [color-scheme:dark]" />
                    </div>
                    <button type="button" onClick={addHolidayRange} className="w-full bg-pink-600/20 text-pink-400 border border-pink-600/50 font-bold py-2 rounded-lg text-xs hover:bg-pink-600/30">
                        + Thêm Lễ
                    </button>
                </div>

                <button onClick={calculateFees} className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-cyan-500/20">
                    TÍNH TIỀN & XUẤT QR
                </button>
            </div>
        </div>
    );
}