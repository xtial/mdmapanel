import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { pool } from '$lib/db/config';

export async function GET({ url }: RequestEvent) {
	const guild = url.searchParams.get('guild');

	if (!guild) {
		return json({ success: false, error: 'Guild parameter is required' }, { status: 400 });
	}

	try {
		const result = await pool.query('SELECT hideseed FROM GUILDSETTINGS WHERE guild = $1', [guild]);

		if (result.rows.length === 0) {
			await pool.query('INSERT INTO GUILDSETTINGS (guild, hideseed) VALUES ($1, $2)', [
				guild,
				false
			]);

			return json({
				success: true,
				displaySeeds: true
			});
		}

		return json({
			success: true,
			displaySeeds: !result.rows[0].hideseed
		});
	} catch (err) {
		console.error('Database error:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST({ request }: RequestEvent) {
	try {
		const { guild, setting, value } = await request.json();

		if (!guild || setting === undefined || value === undefined) {
			return json({ success: false, error: 'Missing required parameters' }, { status: 400 });
		}

		if (setting === 'displaySeeds') {
			await pool.query(
				`INSERT INTO GUILDSETTINGS (guild, hideseed) 
                 VALUES ($1, $2)
                 ON CONFLICT (guild) 
                 DO UPDATE SET hideseed = $2`,
				[guild, !value]
			);
		}

		return json({ success: true });
	} catch (err) {
		console.error('Database error:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
