import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    const filePath = path.join(process.cwd(), 'public', 'product', 'products.json');

    try {
        const fileContents = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContents);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error reading file:", error);
        return NextResponse.json({ error: "Failed to read the file" }, { status: 500 });
    }
}
