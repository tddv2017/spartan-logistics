"use client";
import { useState } from 'react';

export default function InputForm({ formData, handleChange, handleBlurTime, calculateFees }: any) {
    // Biến phụ để lưu ngày đang chọn trên lịch trước khi nhấn "Thêm"
    const [tempHoliday, setTempHoliday] = useState("");

    const addHoliday = () => {
        if (!tempHoliday) return;
        // Kiểm tra xem ngày đó đã được thêm chưa, nếu chưa thì push vào mảng
        if (!formData.holidays.includes(tempHoliday)) {
            handleChange({ 
                target: { name: 'holidays', value: [...formData.holidays, tempHoliday] } 
            });
        }
        setTempHoliday(""); // Xóa ô chọn sau khi thêm
    };

    const removeHoliday = (dateToRemove: string) => {
        handleChange({ 
            target: { name: 'holidays', value: formData.holidays.filter((d: string) => d !== dateToRemove) } 
        });
    };

    return (
        <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400">⚡ SPARTAN LOGISTICS</h2>
            
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

                {/* KHUNG CÀI ĐẶT NGÀY LỄ (DẠNG LỊCH) */}
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <label className="block text-sm font-medium text-pink-400 mb-2">Cài đặt Ngày Lễ (Chọn trên lịch)</label>
                    <div className="flex gap-2">
                        <input 
                            type="date" 
                            value={tempHoliday} 
                            onChange={(e) => setTempHoliday(e.target.value)} 
                            className="flex-1 bg-slate-800 border border-pink-500/50 rounded-lg p-2 text-white focus:outline-none focus:border-pink-500 [color-scheme:dark]"
                        />
                        <button 
                            type="button" 
                            onClick={addHoliday} 
                            className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Thêm Lễ
                        </button>
                    </div>
                    
                    {/* KHU VỰC HIỂN THỊ TAG NGÀY LỄ */}
                    {formData.holidays.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {formData.holidays.map((h: string) => (
                                <span key={h} className="bg-pink-500/20 text-pink-300 border border-pink-500/50 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                    {/* Đảo ngược YYYY-MM-DD thành DD/MM/YYYY cho dễ nhìn */}
                                    {h.split('-').reverse().join('/')}
                                    <button 
                                        type="button" 
                                        onClick={() => removeHoliday(h)} 
                                        className="text-pink-400 hover:text-white hover:bg-pink-500/50 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                                    >
                                        ✕
                                    </button>
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