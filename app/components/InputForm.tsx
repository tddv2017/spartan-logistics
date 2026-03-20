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
                // AUTO-FILL: Bơm thẳng dữ liệu vào Form Tính Tiền bên dưới
                setFormData((prev: any) => ({
                    ...prev,
                    cwInput: data.weight,
                    d1Val: data.dateIn,
                    t1Val: data.timeIn
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

    const addHolidayRange = () => {
        // ... (Giữ nguyên logic thêm ngày Lễ cũ) ...
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
            
            {/* 1. KHUNG TRA CỨU SCSC THÔNG MINH */}
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

                {/* BẢNG HIỂN THỊ KẾT QUẢ SCSC */}
                {trackingInfo && (
                    <div className="mt-4 p-3 bg-slate-900 rounded border border-slate-700 text-sm">
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                            <div><span className="text-slate-500">Chuyến bay:</span> <span className="text-white font-bold">{trackingInfo.flight}</span></div>
                            <div><span className="text-slate-500">Chặng:</span> <span className="text-white">{trackingInfo.origin} ✈️ {trackingInfo.dest}</span></div>
                            <div><span className="text-slate-500">Số kiện:</span> <span className="text-white">{trackingInfo.pieces}</span></div>
                            <div><span className="text-slate-500">Charge Weight:</span> <span className="text-amber-400 font-bold">{trackingInfo.weight} kg</span></div>
                            <div><span className="text-slate-500">Mã SHC:</span> <span className="text-fuchsia-400 font-bold">{trackingInfo.shc}</span></div>
                            <div><span className="text-slate-500">Ngày bay (ATA):</span> <span className="text-cyan-400">{trackingInfo.rawAta}</span></div>
                            <div className="col-span-2 border-t border-slate-800 pt-2 mt-1">
                                <span className="text-slate-500">Shipper:</span> <span className="text-white block truncate" title={trackingInfo.shipper}>{trackingInfo.shipper}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-slate-500">Consignee:</span> <span className="text-white block truncate" title={trackingInfo.consignee}>{trackingInfo.consignee}</span>
                            </div>
                            <div className="col-span-2 border-t border-slate-800 pt-2 mt-1">
                                <span className="text-slate-500 block mb-1">Trạng thái (Status):</span> 
                                <span className="text-emerald-400 text-xs">{trackingInfo.statusText}</span>
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-sky-400 text-center font-bold bg-sky-900/30 py-1 rounded">
                            Đã tự động điền Số Kg và Giờ Đáp vào Form bên dưới! ↓
                        </div>
                    </div>
                )}
            </div>

            {/* 2. KHUNG FORM TÍNH TIỀN (Giữ nguyên như cũ) */}
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Mã Hàng</label>
                        <select name="code" value={formData.code} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 font-bold">
                            <option value="GEN">GEN - Thường</option>
                            <option value="PER">PER - Lạnh</option>
                            <option value="DGR">DGR - Nguy hiểm</option>
                            <option value="AVI">AVI - Động vật</option>
                            <option value="VAL">VAL - Giá trị cao</option>
                            <option value="VUN">VUN - Dễ mất cắp</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-amber-400 mb-1">Tốc độ Phục Vụ</label>
                        <select name="express" value={formData.express} onChange={handleChange} className="w-full bg-slate-700 border border-slate-500 rounded-lg p-3 text-amber-300 font-bold focus:outline-none focus:border-amber-500">
                            <option value="0">Tiêu chuẩn</option>
                            <option value="1">Mức 1 (1.5 - 3H)</option>
                            <option value="2">Mức 2 (3 - 6H)</option>
                            <option value="3">Mức 3 (6 - 9H)</option>
                            <option value="4">Mức 4 (9 - 12H)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Ngày đáp</label>
                        <input type="date" name="d1Val" value={formData.d1Val} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white [color-scheme:dark]"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Giờ đáp</label>
                        <input type="text" name="t1Val" value={formData.t1Val} onChange={handleChange} onBlur={handleBlurTime} placeholder="1048" className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white font-mono text-center focus:outline-none focus:border-cyan-500"/>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Ngày lấy</label>
                        <input type="date" name="d2Val" value={formData.d2Val} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white [color-scheme:dark]"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Giờ lấy</label>
                        <input type="text" name="t2Val" value={formData.t2Val} onChange={handleChange} onBlur={handleBlurTime} placeholder="1300" className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white font-mono text-center focus:outline-none focus:border-cyan-500"/>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Charge Weight (kg)</label>
                        <input type="number" step="0.1" name="cwInput" value={formData.cwInput} onChange={handleChange} placeholder="VD: 212.5" className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-purple-400 mb-1">Ngoài Giờ (OT)</label>
                        <select name="otSelect" value={formData.otSelect} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500">
                            <option value="auto">Tự động (Theo giờ lấy)</option>
                            <option value="0">Không OT (0%)</option>
                            <option value="0.09">17H-22H T2-T7 (9%)</option>
                            <option value="0.18">22H-06H T2-T7 (18%)</option>
                            <option value="0.27">Chủ Nhật / Lễ (27%)</option>
                        </select>
                    </div>
                </div>

                {/* KHUNG CÀI ĐẶT NGÀY LỄ */}
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <label className="block text-sm font-medium text-pink-400 mb-2">Cài đặt Ngày Lễ (Cập nhật cho cả kho)</label>
                    <div className="flex items-center gap-2 mb-2">
                        <input type="date" value={tempStartDate} onChange={(e) => setTempStartDate(e.target.value)} className="flex-1 bg-slate-800 border border-pink-500/50 rounded-lg p-2 text-white focus:outline-none focus:border-pink-500 [color-scheme:dark]" title="Từ ngày" />
                        <span className="text-slate-500 font-bold">-</span>
                        <input type="date" value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} className="flex-1 bg-slate-800 border border-pink-500/50 rounded-lg p-2 text-white focus:outline-none focus:border-pink-500 [color-scheme:dark]" title="Đến ngày (Để trống nếu chỉ nghỉ 1 ngày)" />
                    </div>
                    
                    <button type="button" onClick={addHolidayRange} className="w-full bg-pink-600/20 hover:bg-pink-600/40 text-pink-400 border border-pink-600/50 font-bold py-2 px-4 rounded-lg transition-colors">
                        + Thêm Lễ
                    </button>
                    
                    {formData.holidays?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-700">
                            {formData.holidays.sort().map((h: string) => (
                                <span key={h} className="bg-pink-500/20 text-pink-300 border border-pink-500/50 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                    {h.split('-').reverse().join('/')}
                                    <button type="button" onClick={() => removeHoliday(h)} className="text-pink-400 hover:text-white hover:bg-pink-500/50 rounded-full w-5 h-5 flex items-center justify-center transition-colors">✕</button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <button onClick={calculateFees} className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-lg shadow-cyan-500/30">
                    TÍNH TIỀN
                </button>
            </div>
        </div>
    );
}