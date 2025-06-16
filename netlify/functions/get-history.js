// in netlify/functions/get-history.js

import { getDatabase } from "@netlify/database";

export const handler = async () => {
    try {
        const db = getDatabase();
        const { items } = await db.c("assessments").query({
            sortBy: "createdAt:desc",
            limit: 10,
        });

        return {
            statusCode: 200,
            body: JSON.stringify(items),
        };
    } catch (error) {
        console.error("Error in get-history function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Error fetching history: ${error.message}` }),
        };
    }
};