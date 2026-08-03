# GitHub Copilot instructions

<!-- github-copilot-toolbox:mcp-skills-awareness-begin -->

### MCP & Skills awareness (GitHub Copilot Toolbox)

_Last synced: 2026-08-02T12:31:05.142Z._

- **Full report:** `.github/copilot-toolbox-mcp-skills-awareness.md` in this workspace (auto-overwritten on each scan). Use it as ground truth for configured servers and skill folders.
- **MCP:** For **live tools**, use **Copilot Chat → Agent** and **trust/start** the right servers in the MCP UI.
- **When the user’s task matches a server** (e.g. “open this Confluence page” and a **Confluence** / **Atlassian** MCP is listed), **prefer that server id** and plan on Agent + MCP for actions—not only file search.
- **Skills:** Folders below contain `SKILL.md`; attach or cite paths in chat when relevant.

#### Workspace MCP

- `c:\Users\Saleh Shahab\sentinel-command\app\.vscode\mcp.json` _(workspace: app)_ — _file missing_

_No active workspace servers in mcp.json._

#### User MCP

- `C:\Users\Saleh Shahab\AppData\Roaming\Code\User\mcp.json` — _file missing_

_No active user-scoped servers in mcp.json._

#### Project skills

- **prisma-cli** — `c:\Users\Saleh Shahab\sentinel-command\app\.agents\skills\prisma-cli` — Prisma ORM CLI commands reference covering init, generate, migrate, db, dev, studio, validate, format, debug, and mcp. Use for ORM/database CLI workflows, not Prisma Compute app deployment. For Prisma Compute, `@prisma/c

- **prisma-client-api** — `c:\Users\Saleh Shahab\sentinel-command\app\.agents\skills\prisma-client-api` — Prisma Client API reference covering model queries, filters, operators, and client methods. Use when writing database queries, using CRUD operations, filtering data, or configuring Prisma Client. Triggers on "prisma quer

- **prisma-compute** — `c:\Users\Saleh Shahab\sentinel-command\app\.agents\skills\prisma-compute` — Prisma Compute deployment and hosting guide. Use whenever the user mentions Prisma Compute, `prisma.compute.ts`, `defineComputeConfig`, deploying or hosting a Prisma app, `@prisma/cli app deploy`, `compute:deploy`, `crea

- **prisma-database-setup** — `c:\Users\Saleh Shahab\sentinel-command\app\.agents\skills\prisma-database-setup` — Guides for configuring Prisma with different database providers (PostgreSQL, MySQL, SQLite, MongoDB, etc.). Use when setting up a new project, changing databases, or troubleshooting connection issues. Triggers on "config

- **prisma-driver-adapter-implementation** — `c:\Users\Saleh Shahab\sentinel-command\app\.agents\skills\prisma-driver-adapter-implementation` — Required reference for Prisma v7 driver adapter work. Use when implementing or modifying adapters, adding database drivers, or touching SqlDriverAdapter/Transaction interfaces. Contains critical contract details not infe

- **prisma-mongodb-upgrade** — `c:\Users\Saleh Shahab\sentinel-command\app\.agents\skills\prisma-mongodb-upgrade` — Decision and migration guide for Prisma ORM MongoDB projects on v6, which have no upgrade path to v7. Use when a MongoDB project asks about upgrading Prisma, when "upgrade to prisma 7" comes up in a project with provider

- **prisma-postgres** — `c:\Users\Saleh Shahab\sentinel-command\app\.agents\skills\prisma-postgres` — Prisma Postgres setup and operations guidance across Console, create-db CLI, Management API, and Management API SDK. Use when creating Prisma Postgres databases, working in Prisma Console, provisioning with create-db/cre

- **prisma-postgres-setup** — `c:\Users\Saleh Shahab\sentinel-command\app\.agents\skills\prisma-postgres-setup` — Set up a new Prisma Postgres database and connect it to a local project using the Management API. Use when asked to "set up a database", "create a Prisma Postgres project", "get a connection string", "connect my app to P

- **prisma-upgrade-v7** — `c:\Users\Saleh Shahab\sentinel-command\app\.agents\skills\prisma-upgrade-v7` — Complete migration guide from Prisma ORM v6 to v7 covering all breaking changes. Use when upgrading Prisma versions, encountering v7 errors, or migrating existing projects. Triggers on "upgrade to prisma 7", "prisma 7 mi

#### User skills

- **microsoft-foundry** — `C:\Users\Saleh Shahab\.agents\skills\microsoft-foundry` — Deploy, evaluate, fine-tune, and manage Foundry agents end-to-end with azd: hosted agent scaffold/run/deploy, prompt agent create, batch eval, continuous eval, prompt optimizer, Agent Optimizer scaffold, agent.yaml, data

<!-- github-copilot-toolbox:mcp-skills-awareness-end -->
