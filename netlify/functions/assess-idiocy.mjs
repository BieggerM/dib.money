import { GoogleGenerativeAI } from "@google/generative-ai";
import { neon } from "@netlify/neon";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = process.env.MODELL;
const sql = neon();

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { productName, questions, answers } = JSON.parse(event.body);
    if (!productName || !questions || !answers) {
      return { statusCode: 400, body: "Fehlende Daten." };
    }

    const MAX_ANSWER_LENGTH = 60;

    for (const key in answers) {
      if (
        typeof answers[key] === "string" &&
        answers[key].length > MAX_ANSWER_LENGTH
      ) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: `Antwort für Frage "${key}" überschreitet die maximale Länge von ${MAX_ANSWER_LENGTH} Zeichen.`,
          }),
        };
      }
    }

    const model = genAI.getGenerativeModel({
      model: model,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const context = Object.keys(questions)
      .map((key) => {
        const questionText = questions[key].question;
        const answerText = answers[key];
        return `${key}. ${questionText}\n   Answer: ${answerText}`;
      })
      .join("\n\n");

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
    const responseText = (await result.response).text();
    // parse to json
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error(
        "Failed to parse AI response as JSON:",
        responseText,
        parseError
      );
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "AI response was not valid JSON." }),
      };
    }

    if (jsonResponse.score !== undefined) {
      await sql`
                INSERT INTO assessments (product_name, score, created_at) 
                VALUES (${productName}, ${jsonResponse.score}, ${new Date()})
            `;
    }

    return {
      statusCode: 200,
      body: jsonText,
    };
  } catch (error) {
    console.error("Fehler in assess-idiocy function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Fehler bei der Urteilsfindung." }),
    };
  }
};
