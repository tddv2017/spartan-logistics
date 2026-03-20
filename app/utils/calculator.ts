export const calculateLogisticsFees = (data: any) => {
    const { code, express, otSelect, cwInput, d1Val, t1Val, d2Val, t2Val, holidays } = data;
    const cw = parseFloat(cwInput.replace(',', '.'));
    
    const dt1 = new Date(`${d1Val}T${t1Val || '00:00'}:00`);
    const dt2 = new Date(`${d2Val}T${t2Val || '00:00'}:00`);
    
    if (dt2 < dt1) throw new Error("Ngày lấy hàng không thể trước ngày đáp!");

    const diffHours = (dt2.getTime() - dt1.getTime()) / (1000 * 60 * 60);
    const blocks24h = diffHours <= 0 ? 1 : Math.ceil(diffHours / 24);

    const cal1 = new Date(dt1.getFullYear(), dt1.getMonth(), dt1.getDate());
    const cal2 = new Date(dt2.getFullYear(), dt2.getMonth(), dt2.getDate());
    const calDiff = Math.round((cal2.getTime() - cal1.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // --- BỘ NHẬN DIỆN NGÀY LỄ ---
    const holidayList = (holidays || "").split(",").map((s: string) => s.trim()).filter(Boolean);
    const checkIsHoliday = (dObj: Date) => {
        const d = dObj.getDate().toString().padStart(2, '0');
        const m = (dObj.getMonth() + 1).toString().padStart(2, '0');
        const y = dObj.getFullYear();
        const fullDate = `${d}/${m}/${y}`; // So sánh: 30/04/2026
        const shortDate = `${d}/${m}`;     // So sánh: 30/04
        return holidayList.includes(fullDate) || holidayList.includes(shortDate);
    };

    // --- 1. PHÍ PHỤC VỤ ---
    let feeHand = 0;
    let handLabelText = "Phí Phục Vụ (Tiêu chuẩn)";
    let expLv = parseInt(express);

    if (code === "VAL") {
        feeHand = Math.max(1144500, cw * 5954);
    } else if (expLv === 0) {
        if (code === "PER") feeHand = Math.max(165375, cw * 1575);
        else feeHand = Math.max(157500, cw * 1386);
    } else {
        let lvName = ["", "1.5-3H", "3-6H", "6-9H", "9-12H"][expLv];
        handLabelText = `Phục Vụ Nhanh (${lvName})`;
        if (["GEN", "DGR", "VUN"].includes(code)) {
            feeHand = Math.max(315000, cw * [0, 5670, 3969, 2835, 2041][expLv]);
        } else if (code === "PER") {
            feeHand = Math.max(330750, cw * [0, 5954, 4169, 2982, 2142][expLv]);
        } else if (code === "AVI") {
            feeHand = Math.max(315000, cw * [0, 5670, 3969, 2835][expLv]);
        }
    }

    // --- 2. PHÍ OT (Tự động nhận diện OT Lễ) ---
    let feeOT = 0, otRate = 0, otLabelText = "Phí Ngoài Giờ (OT)";
    if (otSelect === "auto") {
        let isPickupHoliday = checkIsHoliday(dt2);
        let isSun = dt2.getDay() === 0;
        let timeFloat = dt2.getHours() + (dt2.getMinutes() / 60);

        if (isPickupHoliday || isSun) { 
            otRate = 0.27; 
            otLabelText = isPickupHoliday ? "Ngoài Giờ (Lễ 27%)" : "Ngoài Giờ (Chủ Nhật 27%)"; 
        }
        else if (timeFloat >= 17 && timeFloat < 22) { otRate = 0.09; otLabelText = "Ngoài Giờ (17h-22h 9%)"; }
        else if (timeFloat >= 22 || timeFloat <= 6) { otRate = 0.18; otLabelText = "Ngoài Giờ (22h-06h 18%)"; }
    } else {
        otRate = parseFloat(otSelect);
        if (otRate === 0.09) otLabelText = "Ngoài Giờ (Thủ công 9%)";
        if (otRate === 0.18) otLabelText = "Ngoài Giờ (Thủ công 18%)";
        if (otRate === 0.27) otLabelText = "Ngoài Giờ (Thủ công CN/Lễ 27%)";
    }

    if (otRate > 0) {
        feeOT = feeHand * otRate;
        if (feeOT < 78750) { feeOT = 78750; otLabelText += " -> Giá Min"; }
    }

    // --- 3. PHÍ LƯU KHO ---
    let feeStor = 0, feeEscort = 0, daysMsg = "";
    let breakdown = [];

    switch (code) {
        case "GEN":
            if (calDiff <= 3) {
                daysMsg = `${calDiff} ngày lịch (Trong hạn miễn phí)`;
                breakdown.push({ text: "✓ Đã miễn phí lưu kho 3 ngày đầu", isGreen: true });
            } else {
                let g1_count = 0, g2_count = 0, g3_count = 0;
                let feeG1 = 0, feeG2 = 0, feeG3 = 0;
                let heavy_d1 = 0, heavy_d2 = 0, heavy_d3 = 0;
                let isHeavy = cw > 250;
                let chargeableDays = 0;

                for (let i = 3; i < calDiff; i++) {
                    let tempDate = new Date(cal1.getTime() + i * 24 * 60 * 60 * 1000);
                    let isSun = tempDate.getDay() === 0;
                    let isHol = checkIsHoliday(tempDate); // Né thêm ngày Lễ

                    if (!isSun && !isHol) { // Bỏ qua nếu là CN hoặc Lễ
                        chargeableDays++;
                        if (chargeableDays <= 3) {
                            g1_count++;
                            if (!isHeavy) feeG1 += cw * 1397;
                            else {
                                if (chargeableDays === 1) heavy_d1 = (cw * 588) + 202125;
                                if (chargeableDays === 2) heavy_d2 = (cw * 630) + 191625;
                                if (chargeableDays === 3) heavy_d3 = (cw * 945) + 112875;
                            }
                        } else if (chargeableDays <= 7) {
                            g2_count++; feeG2 += cw * 1260;
                        } else {
                            g3_count++; feeG3 += cw * 1659;
                        }
                    }
                }

                if (!isHeavy) {
                    feeStor = feeG1 + feeG2 + feeG3;
                    if (g1_count > 0) breakdown.push({ text: `+ N1-3: ${g1_count} ngày x 1.397 đ = ${Math.round(feeG1).toLocaleString('vi-VN')}` });
                    if (g2_count > 0) breakdown.push({ text: `+ N4-7: ${g2_count} ngày x 1.260 đ = ${Math.round(feeG2).toLocaleString('vi-VN')}` });
                    if (g3_count > 0) breakdown.push({ text: `+ N8+: ${g3_count} ngày x 1.659 đ = ${Math.round(feeG3).toLocaleString('vi-VN')}` });
                } else {
                    feeG1 = heavy_d1 + heavy_d2 + heavy_d3;
                    feeStor = feeG1 + feeG2 + feeG3;
                    breakdown.push({ text: `Hàng > 250kg (Đã bỏ 3 ngày đầu tiên):`, isTitle: true });
                    if (heavy_d1 > 0) breakdown.push({ text: `+ N1 tính phí: ${cw}kg x 588 đ + PP 202k = ${Math.round(heavy_d1).toLocaleString('vi-VN')}` });
                    if (heavy_d2 > 0) breakdown.push({ text: `+ N2 tính phí: ${cw}kg x 630 đ + PP 191k = ${Math.round(heavy_d2).toLocaleString('vi-VN')}` });
                    if (heavy_d3 > 0) breakdown.push({ text: `+ N3 tính phí: ${cw}kg x 945 đ + PP 112k = ${Math.round(heavy_d3).toLocaleString('vi-VN')}` });
                    if (g2_count > 0) breakdown.push({ text: `+ Mức N4-7: ${g2_count} ngày x 1.260 đ = ${Math.round(feeG2).toLocaleString('vi-VN')}` });
                    if (g3_count > 0) breakdown.push({ text: `+ Mức N8+: ${g3_count} ngày x 1.659 đ = ${Math.round(feeG3).toLocaleString('vi-VN')}` });
                }

                if (feeStor > 0 && feeStor < 157500) {
                    feeStor = 157500;
                    breakdown.push({ text: `-> Áp dụng giá Min: 157.500 VNĐ`, isWarn: true });
                }
                daysMsg = `${calDiff} ngày lịch (Đã trừ Lễ/CN nếu có)`;
            }
            break;
        case "PER":
            feeStor = Math.max(250950, cw * 1659) * blocks24h;
            daysMsg = `${blocks24h} block 24h (Tổng ${diffHours.toFixed(1)} giờ)`;
            break;
        case "VAL":
            feeStor = Math.max(1029000, cw * 6290) * calDiff;
            feeEscort = 2577750;
            daysMsg = `${calDiff} ngày lịch (Tính qua mốc 00:00)`;
            break;
        case "DGR":
            feeStor = Math.max(199500, cw * 2079) * calDiff;
            daysMsg = `${calDiff} ngày lịch`; break;
        case "AVI":
            feeStor = Math.max(525000, cw * 1260) * calDiff;
            daysMsg = `${calDiff} ngày lịch`; break;
        case "VUN":
            feeStor = Math.max(171675, cw * 1460) * calDiff;
            daysMsg = `${calDiff} ngày lịch`; break;
    }

    const net = feeHand + feeOT + feeStor + feeEscort;
    const vat = net * 0.08;
    const total = net + vat;

    return {
        feeHand, handLabelText, feeOT, otLabelText, feeEscort, feeStor, vat, total, daysMsg, breakdown
    };
};