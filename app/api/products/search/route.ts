import OpenAIService from "@/app/core/openAIService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const body = await request.json();
    const { messages } = body;
    console.log("Messages:", messages);

    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            const oAIService = OpenAIService.getInstance(process.env.OPENAI_API_KEY);
            const generatedText = await oAIService.productSearch(messages);
            // Extracting the JSON part
            for (const responseContent of generatedText) {
                if (responseContent.role === 'assistant' && responseContent.content) {
                    console.log(responseContent.content);
                    const jsonStart = responseContent.content.indexOf('```json') + 7;
                    const jsonEnd = responseContent.content.indexOf('```', jsonStart);
                    const jsonString = responseContent.content.substring(jsonStart, jsonEnd).trim();
                    // Parsing the JSON string
                    const recommendations = JSON.parse(jsonString);
                    console.log("Recommendations:", recommendations);
                    return NextResponse.json(recommendations);
                }
            }
            return NextResponse.json({ error: 'No recommendations found' });
        } catch (error) {
            attempts += 1;
            console.error(`Attempt ${attempts} - Error communicating with OpenAI:`, error);
            if (attempts >= maxRetries) {
                return NextResponse.json({ error: 'Failed to communicate with OpenAI after multiple attempts' });
            }
        }
    }
}
