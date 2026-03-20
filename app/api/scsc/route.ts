import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get('id');

    if (!trackingId) {
        return NextResponse.json({ error: 'Thiếu mã tra cứu SCSC' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://ecargo.scsc.vn/General/Tracking/Details/${trackingId}`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                // DÁN LẠI COOKIE CỦA BẠN VÀO ĐÂY:
                'Cookie': '_ga=GA1.2.214116948.1758281945; _ga_33R2G7C4SH=GS2.1.s1758281944$o1$g1$t1758282068$j55$l0$h0; .AspNetCore.Antiforgery.okC7iGDNsA0=CfDJ8OXt822iCX5Fqak3hoU4zeBQhMLjbqzwHBBAEc9-D1Cob2C16trBABpYeQAQSH-QYbEoWDGy3hgNHEVZXZVRNeBFRP6DkZTGckNcjAGx0qqxjey7eVuXZ6pK5YVMR4-g5Wk_KFtOXlprDvYzVXH2MiM; eCargo.Account=CfDJ8OXt822iCX5Fqak3hoU4zeAo3Hrq6IvlyyG4pBuwBkecqBpgiWGXNjfNkAO8ohhgg9sieRh0yigU_RLdOUd9jkPA3JpTjX1Tzd3mLZdkFszQDr2iVTU_uYenMP_gGOAl5xw6Nj4LC3rzrJJDrrqeBr4EwB3Qv5N8qz2lbfnOC1oL7htDHS0RFvq6BCJ6hswl_bt_J9YBMQ6CqGI-TbUHpq-45CMAcZcicgFq4W_4U2IF0andWEHGCkfzBP0WomaUi17WhzKyMIGVbpSx5feyxvcGDzPCA2pVEM8eDhmgaxnVHq86xWr34EqunCQ_yEsCT9AfBzCZsip5ag0jq2cTEOs1lNS-oFycTFms4-1xVWdZaCbDxnoLU3CuvUcsq3EanUUKb9XVY-cd8YgQSeMTky6PqX72V33g7eI2ouj6A-iw_agTYPslaUADu5J_65WclfEAZTKf4_qKXTt3jOP7JQzRNhD2qv8uprW_9eLLofJvBdQTVGEPlr5fdeB_Cu2sjae-s3xpWk6WJ1bOB5oo6uTcvKp9DTBbLvfGYu36uBSUvux_qB6sLLl2GgD1aRA3aKXVpSZuO0KznWOegT4GFj8WJq4JncxPJmAs6DySf-QygawrZsBTD-QfzQnLfMtJ3zK3yZ558Ge29RTmptOdpIaRo1XPepZOw-Bp9BQPgfAZIL5C_WrKA_IMPqeTdatL20gAe2B7XZIrMx53eMzIm4zEoOvTxTwQepszQXj1j_-xxlWI42Qxhf-uAAREu4yUweKpCm9767GSNmkwz2Yvkp0fRpVMnlmx4xdfwKyLBFIt1pjS29QqG40WHz1bbgu4Xg' 
            }
        });

        const html = await response.text();
        const $ = cheerio.load(html);

        // Hàm Tầm Gửi: Tìm div tiêu đề (text-muted) -> Lấy text của div bên cạnh
        const extractData = (label: string) => {
            let result = "";
            $('div.text-muted').each((i, el) => {
                if ($(el).text().trim() === label) {
                    result = $(el).next('div').text().trim();
                    // Nếu không có text, lấy HTML bên trong (dùng cho Tình trạng hàng hóa có thẻ <b>, <br>)
                    if (!result) {
                        result = $(el).next('div').html() || "";
                    }
                    return false; // Dừng vòng lặp khi tìm thấy
                }
            });
            return result;
        };

        // Bốc toàn bộ data theo các tiêu đề trên Form SCSC
        const flight = extractData("Chuyến bay");
        const ataText = extractData("Ngày bay"); 
        const origin = extractData("Nơi đi");
        const dest = extractData("Nơi đến");
        const pieces = extractData("Số kiện");
        const weight = extractData("Khối lượng (kgs)");
        const chargeableWeight = extractData("Khối lượng tính cước (kgs)");
        const shipper = extractData("Shipper");
        const consignee = extractData("Consignee");
        const shc = extractData("Mã phục vụ đặc biệt (SHC)");
        
        // Cào đoạn Status và làm sạch các khoảng trắng thừa
        let statusText = extractData("Tình trạng hàng hóa");
        statusText = statusText.replace(/\s+/g, ' ').replace(/<[^>]*>?/gm, ' | ').trim();

        // XỬ LÝ NGÀY GIỜ VÀO FORM
        let dateInText = "";
        let timeInText = "0000";

        if (ataText) {
            const parts = ataText.split(' '); 
            if (parts.length >= 1) {
                const dateParts = parts[0].split('/');
                if (dateParts.length === 3) {
                    dateInText = `${dateParts[2]}-${dateParts[0]}-${dateParts[1]}`; // Chuyển MM/DD/YYYY thành YYYY-MM-DD
                }
            }
            if (parts.length >= 2) {
                timeInText = parts[1].replace(':', ''); // Chuyển 18:40 thành 1840
            }
        }

        // Ưu tiên dùng Chargeable Weight để tính tiền, nếu không có thì dùng Weight
        const finalWeightToBill = chargeableWeight || weight || "0";

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
        return NextResponse.json({ error: 'Lỗi hệ thống hoặc Cookie hết hạn' }, { status: 500 });
    }
}