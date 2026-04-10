import { NextResponse } from 'next/server';

// KHÔNG import pdf ở đây nữa để tránh Turbopack soi lỗi

export async function POST(req: Request) {
    // Ép nạp thư viện theo kiểu CommonJS ngay tại đây
    const pdf = require('pdf-parse');

    try {
        const formData = await req.formData();
        const file: File | null = formData.get('file') as unknown as File;
        
        if (!file) {
            return NextResponse.json({ success: false, error: "Không tìm thấy file" });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sử dụng hàm pdf vừa nạp để bóc tách chữ
        const pdfData = await pdf(buffer);
        const text = pdfData.text;

        // Thuật toán săn mã eDO (VD: 202602000984524...)
        const match = text.match(/202\d{11,}[A-Z0-9]*/i);

        if (match) {
            const fullEdo = match[0];
            // Rút lấy 11 số AWB chuẩn SCSC (Bỏ 4 số năm đầu)
            const awb = fullEdo.substring(4, 15); 
            return NextResponse.json({ success: true, awb: awb });
        }

        return NextResponse.json({ success: false, error: "Không tìm thấy mã eDO SCSC!" });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Lỗi xử lý PDF: " + error.message });
    }
}