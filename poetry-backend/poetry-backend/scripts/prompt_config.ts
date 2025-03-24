export function prompt(html) {
    return `
Given the following HTML page, create a JSON schema for a "PoetrySummary". The schema should include the following fields with their respective types and descriptions:

* summary (string): A short summary of the poem, keep this under 250 words, emphasize influences, who was influenced by this poet, and broader art movements.

* author (string): The author of the poem.

* dateOfBirth (string): The author's date of birth (YYYY-MM-DD).

* dateOfDeath (string): The author's date of death (YYYY-MM-DD).

* placeOfBirth (string): The author's place of birth.

* placeOfResidence (string): The author's place of residence.

${html}
    `;
}

export const config = {
    temperature: 1,
    top_p: 0.95,
    top_k: 40,
    max_output_tokens: 8192,
    response_schema: {
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "A short summary of the poem, keeping it under 250 words. Emphasizes influences, who was influenced by this poet, and broader art movements."
            },
            "author": {
                "type": "string",
                "description": "The author of the poem."
            },
            "dateOfBirth": {
                "type": "string",
                "description": "The author's date of birth (YYYY-MM-DD)."
            },
            "dateOfDeath": {
                "type": "string",
                "description": "The author's date of death (YYYY-MM-DD)."
            },
            "placeOfBirth": {
                "type": "string",
                "description": "The author's place of birth."
            },
            "placeOfResidence": {
                "type": "string",
                "description": "The author's place of residence."
            },
            "tags": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "An array of relevant tags for the poem or poet."
            }
        },
        "required": [
            "author",
            "summary",
            "dateOfBirth",
            "dateOfDeath"
        ]
    },
    response_mime_type: "application/json"
};