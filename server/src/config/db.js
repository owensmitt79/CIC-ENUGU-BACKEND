import { PrismaClient } from '@prisma/client';

// Enable JSON serialization for BigInt values used in epoch timestamps
if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    return Number(this);
  };
}

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient({
      log: ['error', 'warn']
    });
  }
  prisma = global.__db;
}

export { prisma };
export default prisma;
