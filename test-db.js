"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
console.log('DB URL:', process.env.DATABASE_URL ? 'Found' : 'Missing');
const prisma = new client_1.PrismaClient({
    log: ['query']
});
async function main() {
    await prisma.$connect();
    console.log('Connected!');
    await prisma.$disconnect();
}
main().catch(e => {
    console.error(e);
    process.exit(1);
});
