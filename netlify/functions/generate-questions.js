const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);
let aiModel = process.env.AI_MODEL;

exports.handler = async (event) => {
  const startTime = Date.now();
  
  if (event.httpMethod !== "POST") {
    console.warn(`Method not allowed: ${event.httpMethod}`);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed. Use POST request." })
    };
  }

  try {
    const { productName } = JSON.parse(event.body);
    if (!productName) {
      console.error("Product name is missing from request");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Product name is required." })
      };
    }

    const MAX_PRODUCT_NAME_LENGTH = 60;
    if (productName.length > MAX_PRODUCT_NAME_LENGTH) {
      console.warn(`Product name too long`, {
        length: productName.length,
        maxLength: MAX_PRODUCT_NAME_LENGTH
      });
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Product name exceeds maximum length of ${MAX_PRODUCT_NAME_LENGTH} characters.`,
        }),
      };
    }

    console.info(`Generating questions for product: ${productName}`);

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
      console.error("Failed to parse AI response as JSON", {
        responseText,
        error: parseError.message,
        stack: parseError.stack
      });
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "AI response was not valid JSON format." }),
      };
    }

    // Check if the product name is unsuitable
    if (jsonResponse.unsuitableProduct === true) {
      console.info("Product name deemed unsuitable by AI", {
        productName,
        responseText
      });
      return {
        statusCode: 400,
        body: JSON.stringify(jsonResponse),
      };
    }

    const responseTime = Date.now() - startTime;
    console.info(`Questions generated successfully`, {
      productName,
      questionCount: Object.keys(jsonResponse).length,
      responseTime: `${responseTime}ms`
    });

    return {
      statusCode: 200,
      body: responseText,
    };
  } catch (error) {
    console.error("Unhandled error in generate-questions function", {
      error: error.message,
      stack: error.stack,
      productName: productName || 'unknown'
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "An unexpected error occurred while generating questions. Please try again later."
      }),
    };
  }
};
