"use client";

import { useState } from 'react';
import InputForm from '@/app/components/InputForm';
import InvoiceBoard from '@/app/components/InvoiceBoard';
import { calculateLogisticsFees } from '@/app/utils/calculator';

export default function Home() {
    // Thêm <any> để TS không bắt bẻ kiểu dữ liệu của State
    const [formData, setFormData] = useState<any>({
        code: 'GEN', express: '0', otSelect: 'auto',
        d1Val: '', t1Val: '', d2Val: '', t2Val: '', cwInput: ''
    });
    const [result, setResult] = useState<any>(null);

    // Thêm : any cho biến e
    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev: any) => {
            const updated = { ...prev, [name]: value };
            // Auto Select Express
            if (name === 'd2Val' || name === 'cargoCode') autoSelectExpress(updated);
            return updated;
        });
    };

    // Thêm : any cho biến e
    const handleBlurTime = (e: any) => {
        let val = e.target.value.replace(/\D/g, '');
        if (!val) val = "0000";
        if (val.length <= 2) val = val.padEnd(4, '0');
        if (val.length === 3) val = '0' + val;
        if (val.length > 4) val = val.substring(0, 4);
        
        let hh = parseInt(val.substring(0, 2));
        let mm = parseInt(val.substring(2, 4));
        if (hh > 23) hh = 23;
        if (mm > 59) mm = 59;
        
        const formattedTime = (hh < 10 ? '0' + hh : hh) + ":" + (mm < 10 ? '0' + mm : mm);
        
        setFormData((prev: any) => {
            const updated = { ...prev, [e.target.name]: formattedTime };
            autoSelectExpress(updated);
            return updated;
        });
    };

    // Thêm : any cho biến data
    const autoSelectExpress = (data: any) => {
        if (!data.d1Val || !data.d2Val) return;
        const dt1 = new Date(`${data.d1Val}T${data.t1Val || '00:00'}:00`);
        const dt2 = new Date(`${data.d2Val}T${data.t2Val || '00:00'}:00`);
        
        // Thêm .getTime() để TypeScript cho phép trừ ngày tháng
        const diffHours = (dt2.getTime() - dt1.getTime()) / (1000 * 60 * 60);

        let newLevel = "0";
        if (data.code !== "VAL" && diffHours > 0 && diffHours <= 12) {
            if (diffHours <= 3) newLevel = "1";
            else if (diffHours <= 6) newLevel = "2";
            else if (diffHours <= 9) newLevel = "3";
            else if (diffHours <= 12) newLevel = data.code === "AVI" ? "0" : "4";
        }
        if (data.express !== newLevel) setFormData((prev: any) => ({ ...prev, express: newLevel }));
    };

    const handleCalculate = () => {
        if (!formData.d1Val || !formData.d2Val || !formData.cwInput) {
            alert("Vui lòng nhập đầy đủ thông tin!"); return;
        }
        try {
            const res = calculateLogisticsFees(formData);
            setResult(res);
        } catch (error: any) { // Thêm : any cho biến error
            alert(error.message);
        }
    };

    const handleCopy = () => {
        if (!result) return;
        const text = `📄 HÓA ĐƠN KHO VẬN (${formData.code})\n- Trọng lượng: ${formData.cwInput} kg\n--------------------------\n1. ${result.handLabelText}: ${Math.round(result.feeHand).toLocaleString('vi-VN')} đ\n${result.feeOT > 0 ? `*. ${result.otLabelText}: ${Math.round(result.feeOT).toLocaleString('vi-VN')} đ\n` : ''}${result.feeEscort > 0 ? `*. Phí Áp Tải: ${Math.round(result.feeEscort).toLocaleString('vi-VN')} đ\n` : ''}2. Phí Lưu Kho: ${Math.round(result.feeStor).toLocaleString('vi-VN')} đ\n3. Thuế VAT (8%): ${Math.round(result.vat).toLocaleString('vi-VN')} đ\n==========================\n💰 TỔNG CỘNG: ${Math.round(result.total).toLocaleString('vi-VN')} VNĐ`;
        navigator.clipboard.writeText(text);
        alert("Đã Copy hóa đơn!");
    };

    return (
        <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100">
            <div className="max-w-5xl w-full glass-panel rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-700">
                <InputForm formData={formData} handleChange={handleChange} handleBlurTime={handleBlurTime} calculateFees={handleCalculate} />
                <InvoiceBoard result={result} onCopy={handleCopy} />
            </div>
        </main>
    );
}