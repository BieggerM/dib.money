const { GoogleGenerativeAI } = require("@google/generative-ai");
import { getDatabase } from "@netlify/neon";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { productName, questions, answers } = JSON.parse(event.body);
        if (!productName || !questions || !answers) {
            return { statusCode: 400, body: 'Fehlende Daten.' };
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            // WICHTIG: Wir sagen dem Modell, dass die Antwort JSON sein wird.
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        // Kombiniere Fragen und Antworten für den Kontext
        const context = Object.keys(questions).map(key => {
            const questionText = questions[key].question; // Frage aus dem Objekt holen
            const answerText = answers[key];             // Antwort aus dem Objekt holen
            return `${key}. ${questionText}\n   Answer: ${answerText}`;
        }).join('\n\n');
        // Prompt Engineering: Hier wird die Persönlichkeit der App definiert
        const prompt = `
        You are a honest and insightful critic named 'The Idiot Auditor'.
        A user is wondering if their purchase of a "${productName}" was an idiotic decision.
        Here are the questions you asked and the user's answers:
        ---
        ${context}
        ---
        Based on these answers, perform two tasks:
        1.  Write a short, witty, but honest final verdict. Address the user directly as "you".
        2.  Calculate a "stupidity score" as an integer between 0 and 100, where 0 is a genius move and 100 is a complete disaster of a purchase.

        Return the result **exclusively** as a valid JSON object with two keys: "assessment" for the text, and "score" for the integer.
        Do not output anything else.

        JSON Structure Example:
        {
            "assessment": "You didn't just buy a product, you bought a monument to bad decisions. Congratulations.",
            "score": 85
        }
        `;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonText = response.text();
        

        return {
            statusCode: 200,
            // Wir leiten den kompletten JSON-String weiter
            body: jsonText,
        };


    } catch (error) {
        console.error("Fehler in assess-idiocy Funktion:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Fehler bei der Urteilsfindung." }),
        };
    }
};