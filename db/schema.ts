import { integer, pgTable, text, serial, timestamp } from 'drizzle-orm/pg-core';


export const assessments = pgTable("assessments", {
    id: serial("id").primaryKey(),
    productName: text("product_name").notNull(),
    score: integer("score").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });
