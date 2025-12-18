import path from 'path';
import { ingestDatasets } from './ingest';
import { analyzeAllIndustries } from './analyzer';

export async function runFullTrendPipeline(datasetsDir = path.resolve(__dirname, './datasets')): Promise<void> {
  console.log('[Trend][Scheduler] Starting pipeline');
  console.time('[Trend][Scheduler] Total');
  try {
    console.time('[Trend][Ingest]');
    await ingestDatasets(datasetsDir);
    console.timeEnd('[Trend][Ingest]');

    console.time('[Trend][Analyze]');
    const updated = await analyzeAllIndustries(datasetsDir);
    console.timeEnd('[Trend][Analyze]');
    console.log(`[Trend][Analyze] Profiles updated for industries: ${updated.join(', ') || '(none)'}`);
  } catch (err) {
    console.error('[Trend][Scheduler] Pipeline error:', err);
    throw err;
  } finally {
    console.timeEnd('[Trend][Scheduler] Total');
  }
}
