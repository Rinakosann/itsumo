// ビルド時：DBの表をスキーマに合わせる。仕様どおり、仮のデータ（シード）は入れない（空のDBから動く）。
import { execSync } from 'node:child_process';

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL が未設定のため、DBの準備をスキップしました');
  process.exit(0);
}
execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
