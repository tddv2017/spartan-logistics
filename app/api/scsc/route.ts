import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get('id');

    if (!trackingId) {
        return NextResponse.json({ error: 'Thiếu mã tra cứu SCSC' }, { status: 400 });
    }

    try {
        console.log(`\n=== 🚀 ĐANG PHÓNG BOT VÀO SCSC (ID: ${trackingId}) ===`);
        
        const response = await fetch(`https://ecargo.scsc.vn/General/Tracking/Details/${trackingId}`, {
            method: 'GET',
            headers: {
                // Bổ sung đầy đủ giáp trụ để giả lập 100% Chrome đời mới
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://ecargo.scsc.vn/General/Tracking',
                'Connection': 'keep-alive',
                // DÁN COOKIE MỚI NHẤT CỦA BẠN VÀO ĐÂY:
                'Cookie': '_ga=GA1.2.214116948.1758281945; _ga_33R2G7C4SH=GS2.1.s1758281944$o1$g1$t1758282068$j55$l0$h0; .AspNetCore.Antiforgery.okC7iGDNsA0=CfDJ8OXt822iCX5Fqak3hoU4zeBQhMLjbqzwHBBAEc9-D1Cob2C16trBABpYeQAQSH-QYbEoWDGy3hgNHEVZXZVRNeBFRP6DkZTGckNcjAGx0qqxjey7eVuXZ6pK5YVMR4-g5Wk_KFtOXlprDvYzVXH2MiM; eCargo.Account=CfDJ8OXt822iCX5Fqak3hoU4zeBtYhDfaPV0z87ZfpKxToQXGnPNQSNan04FfP-_cxXtZzi7JvD0NOn5f5t-zIpLaGQ4HKsqJNw_fyGBSKB7wHhFUtiBX0Vxvk3v0bZ1C6LhhLkpFXvELviCYW20PNLlHlSBbAXXZmHbc-NBe4qYKe2ce_6VyrY3I-wh26gchAIUj-DglsnsmJBSng3Uc-fK93cR1DmiXMrt08YQ8JJV-3pg-frYuCNR_JH19-PrwIR2aEV0pFHTjQtPLQSGW8UqetI1ZWe2SqNqr_aEiHocztppKD3j0_mv1mA14w83Y48C03ekOkm4yXUaSGSyaCqaUa7RRqYbu1-O2uSmCWcWlbVYY0VKEbuf5AvfIMMLi8xveMPNrpH2emPN31ksxxUxdjSqE7r0Xb78ySUvt0zhlfa47_HCUqBox3CSS7D1lJ-mMj7fAvsb8mpWZcu15-bsC5_7AhSP9XInmEabhZ_aSL8tVQOQ-ov--GNBCB7vsn2wsx35RP1feAha_0Q2leSSeaNHZTrjkzB-HSQFv765KB83XsN3uYDAGQYVtduvaW7pg2EO1ttzsaYZ0wzs34uPfVT5Ama7f-y-cm6PDS7UpClWLfVZYzRNnuzAoCbYJ9sZg0kBPaVr1KeavR3Gib986mc1PzSorLuxgOJV-nQD88cGBrVFDmlwETutmKBTxHKJ-y33JeoXa70VnHnYJTCWPSH9VHrwPP7_8NtUIeuAkbjaM_yc8z7syt3mVoCjAWtStBlLlw4OYGpHKKWi5-VotlDsHFt0Ea2d_CUujxpylWlMM6FxwimGlJSHY8LR5K0lOA' 
            }
        });

        const html = await response.text();
        
        // --- X-RAY: CHỤP QUANG XEM SCSC TRẢ VỀ CÁI GÌ ---
        console.log(`📡 Mã trạng thái (Status): ${response.status}`);
        console.log(`📦 Chiều dài HTML nhận được: ${html.length} ký tự`);
        
        if (html.length < 1000) {
            console.log("🔴 BÁO ĐỘNG: Mã HTML quá ngắn, khả năng bị chặn hoặc Cookie sai!");
            console.log("Mã HTML rác:", html);
        }

        const $ = cheerio.load(html);

        // THUẬT TOÁN BẮT TỪ KHÓA MỀM DẺO (SMART EXTRACT)
        const extractData = (label: string) => {
            let result = "";
            $('div.text-muted').each((i, el) => {
                const textVal = $(el).text().replace(/\s+/g, ' ').trim(); // Dọn dẹp tàn dư khoảng trắng
                // Dùng includes thay vì so sánh bằng tuyệt đối
                if (textVal.includes(label)) {
                    result = $(el).next('div').text().trim();
                    if (!result) result = $(el).next('div').html() || "";
                    return false; 
                }
            });
            return result;
        };

        const flight = extractData("Chuyến bay");
        const ataText = extractData("Ngày bay") || extractData("Ngày đến"); // Thêm backup phòng hờ
        const pieces = extractData("Số kiện");
        const weight = extractData("Khối lượng (kgs)");
        const chargeableWeight = extractData("Khối lượng tính cước (kgs)");
        
        // In ra Terminal xem bốc được gì chưa
        console.log(`🔎 Kết quả quét nhanh: Chuyến bay [${flight}], Số kiện [${pieces}], Nặng [${weight}kg]`);

        if (!flight && !pieces && !weight) {
            return NextResponse.json({ 
                success: false, 
                error: 'SCSC từ chối trả dữ liệu (Màn hình trắng). Hãy kiểm tra Terminal VS Code để xem nguyên nhân!' 
            });
        }

        const origin = extractData("Nơi đi");
        const dest = extractData("Nơi đến");
        const shipper = extractData("Shipper");
        const consignee = extractData("Consignee");
        const shc = extractData("Mã phục vụ đặc biệt (SHC)");
        
        let statusText = extractData("Tình trạng hàng hóa");
        statusText = statusText.replace(/\s+/g, ' ').replace(/<[^>]*>?/gm, ' | ').trim();

        let dateInText = "";
        let timeInText = "0000";

        if (ataText) {
            const parts = ataText.split(' '); 
            if (parts.length >= 1) {
                const dateParts = parts[0].split('/');
                if (dateParts.length === 3) {
                    dateInText = `${dateParts[2]}-${dateParts[0]}-${dateParts[1]}`;
                }
            }
            if (parts.length >= 2) {
                timeInText = parts[1].replace(':', ''); 
            }
        }

        const finalWeightToBill = chargeableWeight || weight || "0";

        console.log("✅ CÀO DỮ LIỆU THÀNH CÔNG! Đang bắn về Client...");

        return NextResponse.json({
            success: true,
            flight, origin, dest, pieces, shipper, consignee, shc, statusText,
            weight: finalWeightToBill,
            dateIn: dateInText, 
            timeIn: timeInText,
            rawAta: ataText 
        });

    } catch (error) {
        console.error("Lỗi cào dữ liệu SCSC:", error);
        return NextResponse.json({ error: 'Lỗi Backend Next.js' }, { status: 500 });
    }
}