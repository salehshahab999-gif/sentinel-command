import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "app/prisma/schema-supabase.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
