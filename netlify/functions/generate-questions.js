const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);
let aiModel = process.env.AI_MODEL;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { productName } = JSON.parse(event.body);
    if (!productName) {
      return { statusCode: 400, body: "Product name is missing." };
    }

    const MAX_PRODUCT_NAME_LENGTH = 60;
    if (productName.length > MAX_PRODUCT_NAME_LENGTH) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Product name exceeds maximum length of ${MAX_PRODUCT_NAME_LENGTH} characters.`,
        }),
      };
    }

    // Configure the model to expect a JSON response
    const model = genAI.getGenerativeModel({
      model: aiModel,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
        You are a cynical and insightful product critic named 'The Idiot Auditor'.
        Your task is to generate 5 -10 probing questions for the product "${productName}" allowing you to grasp the context of the purchase reasoning. 
        **FIRST, assess the suitability of the product name:**
        Is "${productName}" a sensible, specific, single product or service name that someone might genuinely buy or regret buying?
        It should NOT be too vague, nonsensical, a general category (like "food" or "cars"), offensive, or a command/instruction.

        **IF the product name is UNSUITABLE, you MUST respond with the following JSON structure and NOTHING ELSE:**
        { "unsuitableProduct": true }

        **IF the product name is SUITABLE, proceed to generate the 5-10 questions based on these requirements:**
        1.  **Tone:** Critical. The questions should subtly put the user on the defensive.
        2.  **Focus:** Concentrate on the product's potential flaws, the cost. If the purchase seems sound you can ask about the product to get more context.
        3.  **Length:** Each question must be under 12 words.
        4.  **Logic for Question Type:**
            - Use the type 'boolean' for clear Yes/No questions. This should be the majority of questions.
            - Use the type 'text' when a short, specific piece of information (like a number, a price, or a single word) makes more sense than a Yes/No answer.
        **Output Format (for suitable products):**
        Generate the questions **exclusively** as a valid JSON object. Do not output anything else, no introductory sentences, no explanations, and no wrapping \`\`\`json\`\`\` blocks.
        **JSON Structure Example (for suitable products):**
        {
          "1": { "question": "Was that truly the only path to happiness?", "type": "boolean" },
          "2": { "question": "How many paychecks was that again?", "type": "text" }
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

    // Check if the product name is unsuitable
    if (jsonResponse.unsuitableProduct === true) {
      console.log("Product name is unsuitable:", responseText);
      return {
        statusCode: 400,
        body: JSON.stringify(jsonResponse),
      };
    }

    return {
      statusCode: 200,
      body: responseText,
    };
  } catch (error) {
    console.error("Error in generate-questions function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to communicate with the AI." }),
    };
  }
};
