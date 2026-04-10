"use client";

import { useState, useEffect } from 'react';
import InputForm from '@/app/components/InputForm';
import InvoiceBoard from '@/app/components/InvoiceBoard';
import { calculateLogisticsFees, calculateMultiPartFees } from '@/app/utils/calculator';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from '@/app/utils/firebase';

const safeTime = (timeStr: string) => {
    let val = (timeStr || '').replace(/\D/g, '');
    if (!val) return "00:00";
    if (val.length <= 2) val = val.padEnd(4, '0');
    if (val.length === 3) val = '0' + val;
    if (val.length > 4) val = val.substring(0, 4);
    let hh = parseInt(val.substring(0, 2)) || 0;
    let mm = parseInt(val.substring(2, 4)) || 0;
    if (hh > 23) hh = 23;
    if (mm > 59) mm = 59;
    return (hh < 10 ? '0' + hh : String(hh)) + ":" + (mm < 10 ? '0' + mm : String(mm));
};

export default function Home() {
    const [formData, setFormData] = useState<any>({
        code: 'GEN', express: '0', otSelect: 'auto',
        d1Val: '', t1Val: '', d2Val: '', t2Val: '',
        grossInput: '', cwInput: '',
        taxCode: '', awbNo: '',
        holidays: [],
        parts: [],  // [{ id, arrivalDate, grossKg }]
    });
    const [result, setResult] = useState<any>(null);

    // ── FIREBASE SYNC NGÀY LỄ ───────────────────────────────────────────────
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

    // ── AUTO SELECT EXPRESS ──────────────────────────────────────────────────
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
            if (['d1Val', 'd2Val', 't1Val', 't2Val', 'code'].includes(name)) {
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

    // ── TÍNH TOÁN ────────────────────────────────────────────────────────────
    const handleCalculate = () => {
        if (!formData.d1Val || !formData.d2Val || !formData.cwInput) {
            alert("Vui lòng nhập đầy đủ Ngày đáp, Ngày lấy và Charge Weight!");
            return;
        }

        try {
            const t1 = safeTime(formData.t1Val);
            const t2 = safeTime(formData.t2Val);

            const baseData = {
                code: formData.code,
                express: formData.express,
                otSelect: formData.otSelect,
                cwInput: String(formData.cwInput),
                d1Val: formData.d1Val,
                t1Val: t1,
                d2Val: formData.d2Val,
                t2Val: t2,
                holidays: formData.holidays,
            };

            // Kiểm tra có lô hàng hợp lệ không
            const validParts = (formData.parts || []).filter(
                (p: any) => p.arrivalDate && parseFloat(p.grossKg) > 0
            );

            let calcResult;
            if (validParts.length > 0) {
                // MULTI-PART: storage tính từng lô theo CW qui đổi
                calcResult = calculateMultiPartFees({ ...baseData, parts: validParts });
            } else {
                // SINGLE-PART: dùng d1Val làm ngày về kho
                calcResult = calculateLogisticsFees(baseData);
            }

            setResult(calcResult);
        } catch (error: any) {
            alert("Lỗi tính toán: " + error.message);
        }
    };

    // ── COPY HÓA ĐƠN ────────────────────────────────────────────────────────
    const handleCopy = () => {
        if (!result) return;
        const fmtNum = (n: number) => Math.round(n).toLocaleString('vi-VN');
        const fmtKg = (n: number) => n % 1 === 0 ? n.toString() : n.toFixed(2);

        const lines: string[] = [
            `📄 HÓA ĐƠN KHO VẬN (${formData.code})`,
            `- AWB: ${formData.awbNo || "Không có"}`,
        ];

        if (result.isMultiPart) {
            lines.push(`- Tổng Gross: ${fmtKg(result.totalGross)} kg`);
            lines.push(`- Tổng CW: ${fmtKg(result.totalCW)} kg`);
        } else {
            if (formData.grossInput) lines.push(`- Gross: ${formData.grossInput} kg`);
            lines.push(`- Charge Weight: ${formData.cwInput} kg`);
        }

        lines.push(`- ${result.daysMsg}`);
        lines.push(`--------------------------`);

        let idx = 1;
        lines.push(`${idx++}. ${result.handLabelText}: ${fmtNum(result.feeHand)} đ`);
        if (result.feeOT > 0) lines.push(`${idx++}. ${result.otLabelText}: ${fmtNum(result.feeOT)} đ`);
        if (result.feeEscort > 0) lines.push(`${idx++}. Phí Áp Tải (VAL): ${fmtNum(result.feeEscort)} đ`);

        if (result.isMultiPart && result.parts?.length > 0) {
            lines.push(`${idx++}. Phí Lưu Kho (${result.parts.length} lô): ${fmtNum(result.feeStor)} đ`);
            result.parts.forEach((part: any, i: number) => {
                lines.push(`   Lô ${i+1} (${part.arrivalDate.split('-').reverse().join('/')}): Gross ${fmtKg(part.grossKg)}kg → CW ${fmtKg(part.cwPart)}kg | ${part.daysMsg} → ${fmtNum(part.feeStor)} đ`);
            });
        } else {
            lines.push(`${idx++}. Phí Lưu Kho: ${fmtNum(result.feeStor)} đ`);
        }

        lines.push(`${idx}. Thuế VAT (8%): ${fmtNum(result.vat)} đ`);
        lines.push(`==========================`);
        lines.push(`💰 TỔNG CỘNG: ${fmtNum(result.total)} VNĐ`);

        navigator.clipboard.writeText(lines.join('\n'));
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
                <InvoiceBoard
                    result={result}
                    onCopy={handleCopy}
                    awbNo={formData.awbNo}
                    taxCode={formData.taxCode}
                    grossInput={formData.grossInput}
                />
            </div>
        </main>
    );
}
