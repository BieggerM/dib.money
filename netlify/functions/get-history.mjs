import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  const startTime = Date.now();
  
  try {
    console.info("Fetching assessment history");
    
    const history = await sql`
      SELECT product_name, score
      FROM assessments
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const responseTime = Date.now() - startTime;
    console.info(`History retrieved successfully`, {
      recordCount: history.length,
      responseTime: `${responseTime}ms`
    });

    return {
      statusCode: 200,
      body: JSON.stringify(history),
    };
  } catch (error) {
    console.error("Failed to fetch assessment history", {
      error: error.message,
      stack: error.stack
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Unable to retrieve assessment history. Please try again later.",
      }),
    };
  }
};
