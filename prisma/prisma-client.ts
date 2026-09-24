import { PrismaClient } from "@prisma/client";

// Reuse the client across ts-node-dev restarts in dev to avoid exhausting connections.
// Not declared as an ambient global so a missing import is a compile error.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// const prisma = globalForPrisma.prisma || new PrismaClient({log: ["query"]});
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV === "dev") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
