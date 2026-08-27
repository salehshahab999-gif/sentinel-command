import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "app/prisma/schema-local.prisma",
  datasource: {
    url: "file:./app/prisma/sentinel-local.db",
  },
});