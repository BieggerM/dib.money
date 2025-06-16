// in netlify/functions/get-history.js

// WIR BENUTZEN NUR NOCH NEON
import { neon } from '@netlify/neon';

// Einfache Initialisierung des SQL-Clients
const sql = neon();

export const handler = async () => {
    try {
        // === NEUER TEIL: Mit rohem SQL aus der Datenbank lesen ===
        const history = await sql`
            SELECT product_name, score 
            FROM assessments 
            ORDER BY created_at DESC 
            LIMIT 10
        `;
        // ====================================================

        return {
            statusCode: 200,
            // Der `history`-Wert ist bereits ein Array von Objekten, perfekt für das Frontend
            body: JSON.stringify(history),
        };
    } catch (error) {
        console.error("Error in get-history function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Error fetching history: ${error.message}` }),
        };
    }
};