// ローカル開発用のPostgres（PGlite）。本物のDB（Neon）を作らなくても手元で動かせる。
// 使い方: npm run db:local  → 別のターミナルで npm run dev
// .env.local の DATABASE_URL を postgresql://postgres:postgres@127.0.0.1:5434/postgres?sslmode=disable&connection_limit=1 にする
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const db = await PGlite.create('./.pglite');
const server = new PGLiteSocketServer({ db, port: 5434, host: '127.0.0.1', maxConnections: 10 });
await server.start();
console.log('Local Postgres (PGlite) running on postgresql://127.0.0.1:5434/postgres  (Ctrl+C で停止)');
process.on('SIGINT', async () => { await server.stop(); await db.close(); process.exit(0); });
