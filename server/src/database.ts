import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "./database/schema";

config()

if (!process.env.DATABASE_URL) {
    throw new Error("❌ La variable DATABASE_URL est manquante dans le fichier .env !");
}

export const database = drizzle(process.env.DATABASE_URL!, { relations });

export type Database = typeof database;