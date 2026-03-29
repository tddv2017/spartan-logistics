"use client";

import { useState, useEffect } from 'react';
import InputForm from '@/app/components/InputForm';
import InvoiceBoard from '@/app/components/InvoiceBoard';
// import { calculateLogisticsFees } from '@/app/utils/calculator'; <-- TẠM TẮT ĐỂ DÙNG LOGIC MỚI BÊN DƯỚI
// Nhúng Radar Firebase
import { doc, onSnapshot, setDoc } from "firebase/firestore"; 
import { db } from '@/app/utils/firebase'; 

const safeTime = (timeStr: string) => {
    let val = timeStr.replace(/\D/g, '');
    if (!val) return "00:00";
    if (val.length <= 2) val = val.padEnd(4, '0');
    if (val.length === 3) val = '0' + val;
    if (val.length > 4) val = val.substring(0, 4);
    
    let hh = parseInt(val.substring(0, 2)) || 0;
    let mm = parseInt(val.substring(2, 4)) || 0;
    if (hh > 23) hh = 23;
    if (mm > 59) mm = 59;
    return (hh < 10 ? '0' + hh : hh) + ":" + (mm < 10 ? '0' + mm : mm);
};

export default function Home() {
    const [formData, setFormData] = useState<any>({
        code: 'GEN', express: '0', otSelect: 'auto',
        d1Val: '', t1Val: '', d2Val: '', t2Val: '', cwInput: '', taxCode: '', awbNo: '',
        holidays: [] 
    });
    const [result, setResult] = useState<any>(null);

    // =====================================================================
    // 🛰️ RADAR THEO DÕI NGÀY LỄ TỪ FIREBASE (REAL-TIME)
    // =====================================================================
    useEffect(() => {
        const docRef = doc(db, "configs", "logistics");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const fetchedHolidays = docSnap.data().holidays || [];
                setFormData((prev: any) => ({ ...prev, holidays: fetchedHolidays }));
            }
        });
        return () => unsubscribe();
    }, []);

    const updateHolidaysToFirebase = async (newHolidays: string[]) => {
        try {
            const docRef = doc(db, "configs", "logistics");
            await setDoc(docRef, { holidays: newHolidays }, { merge: true });
        } catch (error) {
            console.error("Lỗi khi lưu lên Firebase:", error);
        }
    };

    const autoSelectExpress = (data: any) => {
        if (!data.d1Val || !data.d2Val) return data.express;
        const t1 = safeTime(data.t1Val);
        const t2 = safeTime(data.t2Val);
        const dt1 = new Date(`${data.d1Val}T${t1}:00`);
        const dt2 = new Date(`${data.d2Val}T${t2}:00`);
        const diffHours = (dt2.getTime() - dt1.getTime()) / (1000 * 60 * 60);

        let newLevel = "0";
        if (data.code !== "VAL" && diffHours > 0 && diffHours <= 12) {
            if (diffHours <= 3) newLevel = "1";
            else if (diffHours <= 6) newLevel = "2";
            else if (diffHours <= 9) newLevel = "3";
            else if (diffHours <= 12) newLevel = data.code === "AVI" ? "0" : "4";
        }
        return newLevel;
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev: any) => {
            const updated = { ...prev, [name]: value };
            if (['d1Val', 'd2Val', 't1Val', 't2Val', 'cargoCode'].includes(name)) {
                updated.express = autoSelectExpress(updated);
            }
            if (name === 'holidays') updateHolidaysToFirebase(value);
            return updated;
        });
    };

    const handleBlurTime = (e: any) => {
        const formattedTime = safeTime(e.target.value);
        setFormData((prev: any) => {
            const updated = { ...prev, [e.target.name]: formattedTime };
            updated.express = autoSelectExpress(updated);
            return updated;
        });
    };

    // --- LOGIC TÍNH TOÁN CÓ XỬ LÝ LỄ ---
    const handleCalculate = () => {
        if (!formData.d1Val || !formData.d2Val || !formData.cwInput) {
            alert("Vui lòng nhập đầy đủ Ngày đáp, Ngày lấy và Số kg!"); 
            return;
        }

        try {
            const weight = parseFloat(formData.cwInput);
            const isGen = formData.code === "GEN";
            let chargeDays = 0;
            let holidayCount = 0;
            let breakdown: any[] = [];

            let start = new Date(formData.d1Val);
            let end = new Date(formData.d2Val);

            // Đếm ngày và kiểm tra Lễ
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const isHoliday = formData.holidays.includes(dateStr);
                
                if (isHoliday) {
                    holidayCount++;
                    if (isGen) {
                        breakdown.push({ text: `${dateStr.split('-').reverse().join('/')}: Lễ (MIỄN PHÍ HÀNG THƯỜNG)`, isGreen: true });
                    } else {
                        breakdown.push({ text: `${dateStr.split('-').reverse().join('/')}: Lễ (VẪN TÍNH PHÍ ĐẶC THÙ)`, isWarn: true });
                        chargeDays++;
                    }
                } else {
                    chargeDays++;
                }
            }

            // Tính tiền cơ bản (Mày thay đổi hệ số cho đúng bảng giá SCSC nhé)
            const billableDays = Math.max(0, chargeDays - 3); // Giả sử 3 ngày đầu free
            const feeStor = billableDays * weight * 600; // 600đ/kg/ngày
            const feeHand = Math.max(weight * 850, 150000); // Phí bốc xếp
            const feeOT = formData.otSelect === '0.27' ? feeHand * 0.27 : 0;
            const feeEscort = formData.code === 'VAL' ? 200000 : 0;
            const vat = (feeHand + feeStor + feeOT + feeEscort) * 0.08;

            setResult({
                feeHand, feeStor, feeOT, feeEscort, vat,
                total: feeHand + feeStor + feeOT + feeEscort + vat,
                daysMsg: `${chargeDays} ngày lưu bãi`,
                holidayCount,
                isGenExempt: isGen && holidayCount > 0,
                breakdown,
                handLabelText: "Phí Phục Vụ",
                otLabelText: "Phí Ngoài Giờ"
            });
        } catch (error: any) {
            alert("Lỗi tính toán: " + error.message);
        }
    };

    const handleCopy = () => {
        if (!result) return;
        const text = `📄 HÓA ĐƠN KHO VẬN (${formData.code})\n- Trọng lượng: ${formData.cwInput} kg\n- AWB: ${formData.awbNo || "Không có"}\n--------------------------\n1. ${result.handLabelText}: ${Math.round(result.feeHand).toLocaleString('vi-VN')} đ\n2. Phí Lưu Kho: ${Math.round(result.feeStor).toLocaleString('vi-VN')} đ\n3. Thuế VAT (8%): ${Math.round(result.vat).toLocaleString('vi-VN')} đ\n==========================\n💰 TỔNG CỘNG: ${Math.round(result.total).toLocaleString('vi-VN')} VNĐ`;
        navigator.clipboard.writeText(text);
        alert("Đã Copy hóa đơn!");
    };

    return (
        <main className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans text-slate-100">
            <div className="max-w-5xl w-full bg-slate-900/50 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-700/50">
                <InputForm 
                    formData={formData} 
                    handleChange={handleChange} 
                    handleBlurTime={handleBlurTime} 
                    calculateFees={handleCalculate} 
                    setFormData={setFormData}
                />
                {/* Truyền awbNo và taxCode sang InvoiceBoard để tạo mã QR chuẩn */}
                <InvoiceBoard 
                    result={result} 
                    onCopy={handleCopy} 
                    awbNo={formData.awbNo} 
                    taxCode={formData.taxCode}
                />
            </div>
        </main>
    );
}