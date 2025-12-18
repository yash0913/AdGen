import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { runFullTrendPipeline } from '../trend/scheduler';
import { connectDB } from '../config/db';

dotenv.config();

function resolveDatasetsDir(): string {
  if (process.env.DATASETS_DIR) return process.env.DATASETS_DIR;
  // Prefer src/dist relative folder
  const candidate = path.resolve(__dirname, '../trend/datasets');
  if (fs.existsSync(candidate)) return candidate;
  // Fallback to project root path
  const rootCandidate = path.resolve(process.cwd(), 'backend', 'node', 'src', 'trend', 'datasets');
  return rootCandidate;
}

(async () => {
  try {
    await connectDB();
    const datasetsDir = resolveDatasetsDir();
    console.log('[Trend][CLI] Using datasets dir:', datasetsDir);
    await runFullTrendPipeline(datasetsDir);
    console.log('[Trend][CLI] Done');
    process.exit(0);
  } catch (err) {
    console.error('[Trend][CLI] Failed:', err);
    process.exit(1);
  }
})();
