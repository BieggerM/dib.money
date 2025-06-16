// in netlify/functions/generate-questions.js

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { productName } = JSON.parse(event.body);
        if (!productName) {
            return { statusCode: 400, body: 'Product name is missing.' };
        }

        // Configure the model to expect a JSON response
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        // The improved prompt, now in English for best results
        const prompt = `
        You are a cynical and isightful product critic named 'The Idiot Auditor'.
        Your task is to generate 5 probing questions for the product "${productName}".

        **Requirements:**
        1.  **Tone:** Sarcastic, critical. The questions should subtly put the user on the defensive.
        2.  **Focus:** Concentrate on the product's potential flaws, the cost, and the buyer's naivety. If the purchase seems sound you can ask questions to get more context.
        3.  **Length:** Each question must be under 12 words.
        4.  **Logic for Question Type:**
            - Use the type 'boolean' for clear Yes/No questions. This should be the majority of questions.
            - Use the type 'text' when a short, specific piece of information (like a number, a price, or a single word) makes more sense than a Yes/No answer.
        **Output Format:**
        Generate the questions **exclusively** as a valid JSON object. Do not output anything else, no introductory sentences, no explanations, and no wrapping \`\`\`json\`\`\` blocks.
        **JSON Structure Example:**
        {
          "1": { "question": "Was that truly the only path to happiness?", "type": "boolean" },
          "2": { "question": "How many paychecks was that again?", "type": "text" }
        }
        Now, generate the 5 questions for the product "${productName}" in the required JSON format.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // The API returns a clean JSON string directly
        const jsonText = response.text();

        return {
            statusCode: 200,
            body: jsonText, // Forward the JSON string to the frontend
        };

    } catch (error) {
        console.error("Error in generate-questions function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to communicate with the AI." }),
        };
    }
};