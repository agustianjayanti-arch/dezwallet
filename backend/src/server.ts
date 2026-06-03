import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import { createApp } from './app';
import { env } from './config/env';
import { pool } from './config/database';
import { startWorkers } from './queues/worker';

async function main(): Promise<void> {
    // Verifikasi koneksi database
    try {
        await pool.query('SELECT 1');
        console.log('[Server] Database connection verified.');
    } catch (err) {
        console.error('[Server] Failed to connect to database:', err);
        process.exit(1);
    }

    // Start BullMQ workers (requires Redis — skip if unavailable)
    try {
        startWorkers();
    } catch (err) {
        console.warn('[Server] Workers skipped (Redis unavailable).');
    }

    const app = createApp();
    const port = env.PORT;

    app.listen(port, () => {
        console.log(`[Server] DezPay API running on port ${port}`);
        console.log(`[Server] Swagger docs: http://localhost:${port}/api/docs`);
        console.log(`[Server] Environment: ${env.NODE_ENV}`);
    });
}

main().catch((err) => {
    console.error('[Server] Fatal error:', err);
    process.exit(1);
});
