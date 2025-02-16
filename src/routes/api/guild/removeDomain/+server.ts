import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { pool } from '$lib/db/config';

export async function POST({ request }: RequestEvent) {
	try {
		const { guild, url } = await request.json();

		// Validate required fields
		if (!guild || !url) {
			return json({ success: false, error: 'Missing guild or url' }, { status: 400 });
		}

		// Delete domain from GUILDDOMAINS table
		const query = `
            DELETE FROM GUILDDOMAINS 
            WHERE guild = $1 AND url = $2 
            RETURNING *`;
		const values = [guild, url];

		const result = await pool.query(query, values);

		if (result.rowCount === 0) {
			return json({ success: false, error: 'Domain not found' }, { status: 404 });
		}

		return json({
			success: true,
			message: 'Domain removed successfully',
			domain: result.rows[0]
		});
	} catch (error) {
		console.error('Error removing domain:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
