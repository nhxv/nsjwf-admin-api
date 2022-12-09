import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient;
}

// const prisma = globalThis.prisma || new PrismaClient({log: ["query"]});
const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV === "dev") {
  globalThis.prisma = prisma;
}

export default prisma;