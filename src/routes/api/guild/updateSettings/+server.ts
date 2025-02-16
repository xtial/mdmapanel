import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { pool } from '$lib/db/config';

export async function POST({ request }: RequestEvent) {
	try {
		const { guild, setting, value } = await request.json();

		if (!guild || setting === undefined || value === undefined) {
			return json({ success: false, error: 'Missing required parameters' }, { status: 400 });
		}

		console.log('Received request:', { guild, setting, value });

		if (setting === 'displaySeeds') {
			console.log('Executing query with values:', { guild, hideseed: !value });

			// First try to update
			const updateResult = await pool.query(
				`UPDATE GUILDSETTINGS 
                 SET hideseed = $2 
                 WHERE guild = $1
                 RETURNING *`,
				[guild, !value]
			);

			// If no row was updated, insert new one
			if (updateResult.rowCount === 0) {
				const insertResult = await pool.query(
					`INSERT INTO GUILDSETTINGS (guild, hideseed)
                     VALUES ($1, $2)
                     RETURNING *`,
					[guild, !value]
				);
				console.log('Inserted new row:', insertResult.rows[0]);
			} else {
				console.log('Updated existing row:', updateResult.rows[0]);
			}
		}

		return json({ success: true });
	} catch (err) {
		const error = err as { message: string; code?: string; detail?: string };
		console.error('Detailed error:', {
			message: error.message,
			code: error.code,
			detail: error.detail
		});
		return json(
			{
				success: false,
				error: 'Internal server error',
				detail: error.message
			},
			{ status: 500 }
		);
	}
}
