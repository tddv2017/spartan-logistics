import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    // Nhận đầu vào (có thể là AWB "618-51448692" hoặc ID "34925530")
    const trackingInput = searchParams.get('id') || '';
    
    // Gọt bỏ sạch sẽ dấu gạch ngang, dấu cách thừa
    const cleanInput = trackingInput.replace(/[^a-zA-Z0-9]/g, '');

    if (!cleanInput) {
        return NextResponse.json({ error: 'Thiếu mã tra cứu SCSC' }, { status: 400 });
    }

    try {
        let internalId = cleanInput;
        let html = "";
        
        // --- 🔑 KHU VỰC DÁN COOKIE ---
        const reqHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Referer': 'https://ecargo.scsc.vn/General/Tracking',
            // NHỚ DÁN COOKIE CỦA BẠN VÀO ĐÂY NẾU NÓ HẾT HẠN NHÉ:
            'Cookie': '_ga=GA1.2.214116948.1758281945; _ga_33R2G7C4SH=GS2.1.s1758281944$o1$g1$t1758282068$j55$l0$h0; .AspNetCore.Antiforgery.okC7iGDNsA0=CfDJ8OXt822iCX5Fqak3hoU4zeBQhMLjbqzwHBBAEc9-D1Cob2C16trBABpYeQAQSH-QYbEoWDGy3hgNHEVZXZVRNeBFRP6DkZTGckNcjAGx0qqxjey7eVuXZ6pK5YVMR4-g5Wk_KFtOXlprDvYzVXH2MiM; eCargo.Account=CfDJ8OXt822iCX5Fqak3hoU4zeBtYhDfaPV0z87ZfpKxToQXGnPNQSNan04FfP-_cxXtZzi7JvD0NOn5f5t-zIpLaGQ4HKsqJNw_fyGBSKB7wHhFUtiBX0Vxvk3v0bZ1C6LhhLkpFXvELviCYW20PNLlHlSBbAXXZmHbc-NBe4qYKe2ce_6VyrY3I-wh26gchAIUj-DglsnsmJBSng3Uc-fK93cR1DmiXMrt08YQ8JJV-3pg-frYuCNR_JH19-PrwIR2aEV0pFHTjQtPLQSGW8UqetI1ZWe2SqNqr_aEiHocztppKD3j0_mv1mA14w83Y48C03ekOkm4yXUaSGSyaCqaUa7RRqYbu1-O2uSmCWcWlbVYY0VKEbuf5AvfIMMLi8xveMPNrpH2emPN31ksxxUxdjSqE7r0Xb78ySUvt0zhlfa47_HCUqBox3CSS7D1lJ-mMj7fAvsb8mpWZcu15-bsC5_7AhSP9XInmEabhZ_aSL8tVQOQ-ov--GNBCB7vsn2wsx35RP1feAha_0Q2leSSeaNHZTrjkzB-HSQFv765KB83XsN3uYDAGQYVtduvaW7pg2EO1ttzsaYZ0wzs34uPfVT5Ama7f-y-cm6PDS7UpClWLfVZYzRNnuzAoCbYJ9sZg0kBPaVr1KeavR3Gib986mc1PzSorLuxgOJV-nQD88cGBrVFDmlwETutmKBTxHKJ-y33JeoXa70VnHnYJTCWPSH9VHrwPP7_8NtUIeuAkbjaM_yc8z7syt3mVoCjAWtStBlLlw4OYGpHKKWi5-VotlDsHFt0Ea2d_CUujxpylWlMM6FxwimGlJSHY8LR5K0lOA' 
        };

        // =========================================================
        // BƯỚC 1: NẾU GÕ AWB (> 10 KÝ TỰ) -> ĐI TÌM ID NỘI BỘ
        // =========================================================
        if (cleanInput.length >= 10) {
            console.log(`\n=== 🚀 BƯỚC 1: SĂN LÙNG ID NỘI BỘ CHO AWB [${cleanInput}] ===`);
            const searchRes = await fetch(`https://ecargo.scsc.vn/General/Tracking?id=${cleanInput}`, { headers: reqHeaders });
            const searchHtml = await searchRes.text();
            
            // X-Ray tia quét thẻ input ẩn hoặc các đường link có chứa số ID
            const idMatch = searchHtml.match(/id="modal-value" value="(\d+)"/i) 
                         || searchHtml.match(/\/General\/Tracking\/Details\/(\d+)/i)
                         || searchHtml.match(/<input type="hidden" value="(\d{8,9})">/i);

            if (idMatch && idMatch[1]) {
                internalId = idMatch[1];
                console.log(`🎯 ĐÃ TÌM THẤY ID NỘI BỘ: ${internalId}`);
            } else if (searchHtml.includes('Thông tin AWB')) {
                // Trường hợp web nó trả thẳng trang chi tiết luôn (không qua modal)
                html = searchHtml; 
            } else {
                console.log("Mã HTML lỗi:", searchHtml.substring(0, 500));
                return NextResponse.json({ 
                    success: false, 
                    error: `Không tìm thấy AWB ${trackingInput} trên hệ thống SCSC (Hoặc sai số).` 
                });
            }
        }

        // =========================================================
        // BƯỚC 2: PHI VÀO TRANG CHI TIẾT CÀO DỮ LIỆU
        // =========================================================
        if (!html) {
            console.log(`\n=== 🚀 BƯỚC 2: CÀO DỮ LIỆU TỪ MÃ [${internalId}] ===`);
            const detailRes = await fetch(`https://ecargo.scsc.vn/General/Tracking/Details/${internalId}`, { headers: reqHeaders });
            html = await detailRes.text();
        }

        if (html.length < 1000) {
            return NextResponse.json({ 
                success: false, 
                error: 'SCSC từ chối truy cập (Màn hình trắng). Vui lòng cập nhật Cookie mới!' 
            });
        }

        const $ = cheerio.load(html);

        // THUẬT TOÁN TẦM GỬI (Được tối ưu riêng cho cái Modal Bootstrap của SCSC)
        const extractData = (label: string) => {
            let result = "";
            $('div.text-muted').each((i, el) => {
                const textVal = $(el).text().replace(/\s+/g, ' ').trim();
                if (textVal === label || textVal.includes(label)) {
                    result = $(el).next('div').text().trim();
                    if (!result) result = $(el).next('div').html() || "";
                    return false; 
                }
            });
            return result;
        };

        const flight = extractData("Chuyến bay");
        const ataText = extractData("Ngày bay") || extractData("Ngày đến"); 
        const origin = extractData("Nơi đi");
        const dest = extractData("Nơi đến");
        const pieces = extractData("Số kiện");
        const weight = extractData("Khối lượng (kgs)");
        const chargeableWeight = extractData("Khối lượng tính cước (kgs)");
        const shipper = extractData("Shipper");
        const consignee = extractData("Consignee");
        const shc = extractData("Mã phục vụ đặc biệt (SHC)");
        
        // Làm sạch Trạng thái
        let statusText = extractData("Tình trạng hàng hóa");
        statusText = statusText.replace(/\s+/g, ' ').replace(/<br\s*[\/]?>/gi, ' | ').replace(/<[^>]*>?/gm, '').trim();

        // Bẫy lỗi không có dữ liệu
        if (!flight && !pieces && !weight) {
            return NextResponse.json({ 
                success: false, 
                error: 'Cào dữ liệu thất bại. Lô hàng này có thể bị lỗi hiển thị trên SCSC.' 
            });
        }

        // BỘ XỬ LÝ NGÀY GIỜ (Chuẩn Mỹ sang Chuẩn Form)
        let dateInText = "";
        let timeInText = "0000";

        if (ataText) {
            const parts = ataText.split(' '); 
            if (parts.length >= 1) {
                const dateParts = parts[0].split('/');
                if (dateParts.length === 3) {
                    // Cắt MM/DD/YYYY thành YYYY-MM-DD
                    dateInText = `${dateParts[2]}-${dateParts[0]}-${dateParts[1]}`;
                }
            }
            if (parts.length >= 2) {
                timeInText = parts[1].replace(':', ''); 
            }
        }

        const finalWeightToBill = chargeableWeight || weight || "0";

        console.log("✅ CÀO THÀNH CÔNG! Bắn thẳng vào Form Tính Tiền.");

        return NextResponse.json({
            success: true,
            flight, origin, dest, pieces, shipper, consignee, shc, statusText,
            weight: finalWeightToBill,
            dateIn: dateInText, 
            timeIn: timeInText,
            rawAta: ataText 
        });

    } catch (error) {
        console.error("Lỗi sập Backend:", error);
        return NextResponse.json({ error: 'Lỗi máy chủ Next.js' }, { status: 500 });
    }
}