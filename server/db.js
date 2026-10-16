// Prisma（DBへの接続）。サーバーレスで接続が増えすぎないよう1つを使い回す。
import { PrismaClient } from '@prisma/client';

const g = globalThis;
export const prisma = g.__prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') g.__prisma = prisma;
