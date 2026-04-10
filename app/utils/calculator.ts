// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const makeHolidayChecker = (holidays: string[]) => (dObj: Date): boolean => {
    const d = dObj.getDate().toString().padStart(2, '0');
    const m = (dObj.getMonth() + 1).toString().padStart(2, '0');
    const y = dObj.getFullYear();
    return holidays.includes(`${y}-${m}-${d}`);
};

interface StorageResult {
    feeStor: number;
    feeEscort: number;
    daysMsg: string;
    breakdown: any[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE: Tính phí lưu kho cho 1 đơn vị (single hoặc 1 lô trong multi-part)
// ─────────────────────────────────────────────────────────────────────────────
const calcStorageFee = (
    code: string,
    cw: number,
    arrivalDt: Date,
    pickupDt: Date,
    holidays: string[],
): StorageResult => {
    const checkIsHoliday = makeHolidayChecker(holidays);
    const cal1 = new Date(arrivalDt.getFullYear(), arrivalDt.getMonth(), arrivalDt.getDate());
    const cal2 = new Date(pickupDt.getFullYear(), pickupDt.getMonth(), pickupDt.getDate());
    const calDiff = Math.round((cal2.getTime() - cal1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const diffHours = (pickupDt.getTime() - arrivalDt.getTime()) / (1000 * 60 * 60);
    const blocks24h = diffHours <= 0 ? 1 : Math.ceil(diffHours / 24);

    let feeStor = 0, feeEscort = 0;
    let daysMsg = "";
    let breakdown: any[] = [];

    switch (code) {
        case "GEN": {
            if (calDiff <= 3) {
                daysMsg = `${calDiff} ngày lịch (Miễn phí)`;
                breakdown.push({ text: "✓ Đã miễn phí lưu kho 3 ngày đầu", isGreen: true });
            } else {
                let g1_count = 0, g2_count = 0, g3_count = 0;
                let feeG1 = 0, feeG2 = 0, feeG3 = 0;
                let heavy_d1 = 0, heavy_d2 = 0, heavy_d3 = 0;
                const isHeavy = cw > 250;
                let chargeableDays = 0;

                for (let i = 3; i < calDiff; i++) {
                    const tempDate = new Date(cal1.getFullYear(), cal1.getMonth(), cal1.getDate() + i);
                    const isSun = tempDate.getDay() === 0;
                    const isHol = checkIsHoliday(tempDate);

                    if (!isSun && !isHol) {
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
                    if (g1_count > 0) breakdown.push({ text: `+ N1-3: ${g1_count} ngày × ${cw.toFixed(2)}kg × 1.397 = ${Math.round(feeG1).toLocaleString('vi-VN')}` });
                    if (g2_count > 0) breakdown.push({ text: `+ N4-7: ${g2_count} ngày × ${cw.toFixed(2)}kg × 1.260 = ${Math.round(feeG2).toLocaleString('vi-VN')}` });
                    if (g3_count > 0) breakdown.push({ text: `+ N8+: ${g3_count} ngày × ${cw.toFixed(2)}kg × 1.659 = ${Math.round(feeG3).toLocaleString('vi-VN')}` });
                } else {
                    feeG1 = heavy_d1 + heavy_d2 + heavy_d3;
                    feeStor = feeG1 + feeG2 + feeG3;
                    breakdown.push({ text: `Hàng > 250kg (bỏ 3 ngày đầu):`, isTitle: true });
                    if (heavy_d1 > 0) breakdown.push({ text: `+ N1: ${cw.toFixed(2)}kg × 588 + 202k = ${Math.round(heavy_d1).toLocaleString('vi-VN')}` });
                    if (heavy_d2 > 0) breakdown.push({ text: `+ N2: ${cw.toFixed(2)}kg × 630 + 191k = ${Math.round(heavy_d2).toLocaleString('vi-VN')}` });
                    if (heavy_d3 > 0) breakdown.push({ text: `+ N3: ${cw.toFixed(2)}kg × 945 + 112k = ${Math.round(heavy_d3).toLocaleString('vi-VN')}` });
                    if (g2_count > 0) breakdown.push({ text: `+ N4-7: ${g2_count} ngày × 1.260 = ${Math.round(feeG2).toLocaleString('vi-VN')}` });
                    if (g3_count > 0) breakdown.push({ text: `+ N8+: ${g3_count} ngày × 1.659 = ${Math.round(feeG3).toLocaleString('vi-VN')}` });
                }

                if (feeStor > 0 && feeStor < 157500) {
                    feeStor = 157500;
                    breakdown.push({ text: `→ Áp dụng giá Min: 157.500 VNĐ`, isWarn: true });
                }
                daysMsg = `${calDiff} ngày lịch (Đã trừ Lễ/CN)`;
            }
            break;
        }
        case "PER":
            feeStor = Math.max(250950, cw * 1659) * blocks24h;
            daysMsg = `${blocks24h} block 24h (${diffHours.toFixed(1)} giờ)`;
            break;
        case "VAL":
            feeStor = Math.max(1029000, cw * 6290) * calDiff;
            feeEscort = 2577750;
            daysMsg = `${calDiff} ngày lịch`;
            break;
        case "DGR":
            feeStor = Math.max(199500, cw * 2079) * calDiff;
            daysMsg = `${calDiff} ngày lịch`;
            break;
        case "AVI":
            feeStor = Math.max(525000, cw * 1260) * calDiff;
            daysMsg = `${calDiff} ngày lịch`;
            break;
        case "VUN":
            feeStor = Math.max(171675, cw * 1460) * calDiff;
            daysMsg = `${calDiff} ngày lịch`;
            break;
    }

    return { feeStor, feeEscort, daysMsg, breakdown };
};

// ─────────────────────────────────────────────────────────────────────────────
// CORE: Tính phí phục vụ + OT (dùng chung single/multi-part)
// ─────────────────────────────────────────────────────────────────────────────
const calcHandlingAndOT = (
    code: string,
    express: string,
    cw: number,
    dt2: Date,
    otSelect: string,
    holidays: string[],
) => {
    const checkIsHoliday = makeHolidayChecker(holidays);
    let feeHand = 0;
    let handLabelText = "Phí Phục Vụ (Tiêu chuẩn)";
    const expLv = parseInt(express);

    if (code === "VAL") {
        feeHand = Math.max(1144500, cw * 5954);
    } else if (expLv === 0) {
        if (code === "PER") feeHand = Math.max(165375, cw * 1575);
        else feeHand = Math.max(157500, cw * 1386);
    } else {
        const lvName = ["", "1.5-3H", "3-6H", "6-9H", "9-12H"][expLv];
        handLabelText = `Phục Vụ Nhanh (${lvName})`;
        if (["GEN", "DGR", "VUN"].includes(code)) {
            feeHand = Math.max(315000, cw * ([0, 5670, 3969, 2835, 2041][expLv] ?? 2041));
        } else if (code === "PER") {
            feeHand = Math.max(330750, cw * ([0, 5954, 4169, 2982, 2142][expLv] ?? 2142));
        } else if (code === "AVI") {
            // AVI tối đa level 3
            feeHand = Math.max(315000, cw * ([0, 5670, 3969, 2835, 2835][expLv] ?? 2835));
        }
    }

    let feeOT = 0, otRate = 0;
    let otLabelText = "Phí Ngoài Giờ (OT)";

    if (otSelect === "auto") {
        const isPickupHoliday = checkIsHoliday(dt2);
        const isSun = dt2.getDay() === 0;
        const timeFloat = dt2.getHours() + (dt2.getMinutes() / 60);

        if (isPickupHoliday || isSun) {
            otRate = 0.27;
            otLabelText = isPickupHoliday ? "Ngoài Giờ (Lễ 27%)" : "Ngoài Giờ (Chủ Nhật 27%)";
        } else if (timeFloat >= 17 && timeFloat < 22) {
            otRate = 0.09; otLabelText = "Ngoài Giờ (17h-22h 9%)";
        } else if (timeFloat >= 22 || timeFloat <= 6) {
            otRate = 0.18; otLabelText = "Ngoài Giờ (22h-06h 18%)";
        }
    } else {
        otRate = parseFloat(otSelect);
        if (otRate === 0.09) otLabelText = "Ngoài Giờ (Thủ công 9%)";
        if (otRate === 0.18) otLabelText = "Ngoài Giờ (Thủ công 18%)";
        if (otRate === 0.27) otLabelText = "Ngoài Giờ (Thủ công CN/Lễ 27%)";
    }

    if (otRate > 0) {
        feeOT = feeHand * otRate;
        if (feeOT < 78750) { feeOT = 78750; otLabelText += " → Giá Min"; }
    }

    return { feeHand, handLabelText, feeOT, otLabelText };
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT: Hàng về 1 lần (single-part)
// ─────────────────────────────────────────────────────────────────────────────
export const calculateLogisticsFees = (data: any) => {
    const { code, express, otSelect, cwInput, d1Val, t1Val, d2Val, t2Val, holidays } = data;
    const cw = parseFloat(String(cwInput).replace(',', '.'));

    const dt1 = new Date(`${d1Val}T${t1Val || '00:00'}:00`);
    const dt2 = new Date(`${d2Val}T${t2Val || '00:00'}:00`);

    if (dt2 < dt1) throw new Error("Ngày lấy hàng không thể trước ngày đáp!");

    const { feeHand, handLabelText, feeOT, otLabelText } = calcHandlingAndOT(code, express, cw, dt2, otSelect, holidays);
    const { feeStor, feeEscort, daysMsg, breakdown } = calcStorageFee(code, cw, dt1, dt2, holidays);

    const net = feeHand + feeOT + feeStor + feeEscort;
    const vat = net * 0.08;
    const total = net + vat;

    return { feeHand, handLabelText, feeOT, otLabelText, feeEscort, feeStor, vat, total, daysMsg, breakdown };
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT: Hàng về nhiều lô (multi-part)
// Phí phục vụ + OT: tính 1 lần trên TỔNG CW
// Phí lưu kho: tính từng lô, CW qui đổi theo tỉ lệ Gross
// ─────────────────────────────────────────────────────────────────────────────
export interface PartInput {
    id: string;
    arrivalDate: string;  // "yyyy-mm-dd"
    grossKg: string;
}

export interface PartResult {
    arrivalDate: string;
    grossKg: number;
    cwPart: number;
    feeStor: number;
    daysMsg: string;
    breakdown: any[];
}

export const calculateMultiPartFees = (data: any) => {
    const { code, express, otSelect, cwInput, d1Val, t1Val, d2Val, t2Val, holidays, parts } = data;

    const totalCW = parseFloat(String(cwInput).replace(',', '.'));
    const validParts: PartInput[] = (parts as PartInput[]).filter(
        p => p.arrivalDate && parseFloat(p.grossKg) > 0
    );

    if (validParts.length === 0) throw new Error("Vui lòng nhập ít nhất 1 lô hàng có ngày về và gross!");

    const totalGross = validParts.reduce((sum, p) => sum + parseFloat(p.grossKg), 0);

    const dt1 = new Date(`${d1Val}T${t1Val || '00:00'}:00`);
    const dt2 = new Date(`${d2Val}T${t2Val || '00:00'}:00`);

    if (dt2 < dt1) throw new Error("Ngày lấy hàng không thể trước ngày đáp!");

    // Phí phục vụ + OT: 1 lần trên TỔNG CW
    const { feeHand, handLabelText, feeOT, otLabelText } = calcHandlingAndOT(code, express, totalCW, dt2, otSelect, holidays);

    // Phí lưu kho: từng lô với CW qui đổi
    let totalFeeStor = 0;
    let feeEscort = 0;
    const partsResult: PartResult[] = [];

    for (const part of validParts) {
        const partGross = parseFloat(part.grossKg);
        const partCW = (partGross / totalGross) * totalCW;

        const [py, pm, pd] = part.arrivalDate.split('-').map(Number);
        const partDt1 = new Date(py, pm - 1, pd, 0, 0, 0);

        if (dt2 < partDt1) {
            partsResult.push({
                arrivalDate: part.arrivalDate,
                grossKg: partGross,
                cwPart: partCW,
                feeStor: 0,
                daysMsg: "⚠ Ngày lấy trước ngày về lô này!",
                breakdown: [],
            });
            continue;
        }

        const { feeStor: partFeeStor, feeEscort: partEscort, daysMsg, breakdown } =
            calcStorageFee(code, partCW, partDt1, dt2, holidays);

        totalFeeStor += partFeeStor;
        if (partEscort > 0) feeEscort = partEscort; // VAL escort: chỉ tính 1 lần

        partsResult.push({
            arrivalDate: part.arrivalDate,
            grossKg: partGross,
            cwPart: partCW,
            feeStor: partFeeStor,
            daysMsg,
            breakdown,
        });
    }

    const net = feeHand + feeOT + totalFeeStor + feeEscort;
    const vat = net * 0.08;
    const total = net + vat;

    return {
        feeHand, handLabelText, feeOT, otLabelText, feeEscort,
        feeStor: totalFeeStor, vat, total,
        daysMsg: `${partsResult.length} lô hàng`,
        breakdown: [],
        isMultiPart: true,
        totalGross,
        totalCW,
        parts: partsResult,
    };
};
