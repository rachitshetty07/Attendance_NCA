
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RequestBody {
    type: 'placename' | 'search';
    payload: any;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Ensure API key is available
    if (!process.env.API_KEY) {
        console.error('API_KEY environment variable not set.');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    try {
        // Dynamically import the SDK. This works in Vercel's Node.js environment.
        const { GoogleGenAI, Type } = await (eval('import("https://esm.sh/@google/genai")') as Promise<any>);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const { type, payload } = req.body as RequestBody;

        let geminiResponse;

        switch (type) {
            case 'placename': {
                const { latitude, longitude } = payload;
                if (latitude === undefined || longitude === undefined) {
                    return res.status(400).json({ error: 'Latitude and longitude are required for placename lookup.' });
                }
                geminiResponse = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: `Provide a short place name for latitude: ${latitude}, longitude: ${longitude}. Include city and country. For example: 'San Francisco, USA'.`,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                place: { type: Type.STRING, description: "Short place name." }
                            }
                        }
                    }
                });
                break;
            }
            case 'search': {
                const { query, contextData } = payload;
                if (!query || !contextData) {
                    return res.status(400).json({ error: 'Query and contextData are required for search.' });
                }
                const systemInstruction = `You are a helpful HR assistant for 'Raghavan Chaudhuri and Narayanan'. Your task is to analyze the provided JSON data of employee attendance records to answer questions.
- The 'employees' array lists all employees.
- The 'records' array contains all clock-in/out events.
- 'status: pending' means a late clock-in requires manager approval.
- Today's date is ${new Date().toDateString()}.
- Base your answers strictly on the data provided.
- Be concise and clear. Format your answer for readability.
- If the data is insufficient to answer, say so.`;
                geminiResponse = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: `Question: "${query}"\n\nJSON Data:\n${JSON.stringify(contextData, null, 2)}`,
                    config: {
                        systemInstruction: systemInstruction,
                        temperature: 0.2,
                    }
                });
                break;
            }
            default:
                return res.status(400).json({ error: 'Invalid request type.' });
        }

        return res.status(200).json({ text: geminiResponse.text });

    } catch (error) {
        console.error('Error in proxy handler:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return res.status(500).json({ error: 'An internal server error occurred.', details: errorMessage });
    }
}
