const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyDKXqdKkLn96Fz_47qq1_MVjfJtaYJEH6I");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
import { testPrompt } from './testPrompt';

const generationConfig = {
    temperature: 1,
    top_p: 0.95,
    top_k: 40,
    max_output_tokens: 8192,
    response_schema: {
        "type": "object",
        "properties": {
            "summary": {
                "type": "string"
            },
            "author": {
                "type": "string"
            },
            "Date of Birth": {
                "type": "string"
            },
            "Date of Death": {
                "type": "string"
            },
            "Place of Birth": {
                "type": "string"
            },
            "Place of Residence": {
                "type": "string"
            },
            "tags": {
                "type": "array",
                "items": {
                    "type": "string"
                }
            }
        },
        "required": [
            "author",
            "summary",
            "Date of Birth",
            "Date of Death"
        ]
    },
    "response_mime_type": "application/json",
};

async function main() {
    const result = await model.generateContent({
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: testPrompt
                    }
                ],
            },

        ],
        generationConfig
    });
    console.log(JSON.stringify(result))
}

main();
