"use client";

export default function InputForm({ formData, handleChange, handleBlurTime, calculateFees }) {
    return (
        <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400">⚡SMART CALCULATOR LOGISTICS</h2>
            
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

                <button onClick={calculateFees} className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-lg shadow-cyan-500/30">
                    TÍNH TIỀN
                </button>
            </div>
        </div>
    );
}