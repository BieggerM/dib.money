import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async () => {
  try {
    const history = await sql`
            SELECT product_name, score 
            FROM assessments 
            ORDER BY created_at DESC 
            LIMIT 10
        `;

    return {
      statusCode: 200,
      body: JSON.stringify(history),
    };
  } catch (error) {
    console.error("Error in get-history function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Error fetching history: ${error.message}`,
      }),
    };
  }
};
