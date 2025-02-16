import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { pool } from '$lib/db/config';

export async function POST({ request }: RequestEvent) {
	try {
		const { username, amount, totalAmount, percentage_cut, date_registered, status, guild } =
			await request.json();

		if (!username || !amount || !totalAmount || !percentage_cut || !date_registered || !guild) {
			return json({ success: false, error: 'Missing required parameters' }, { status: 400 });
		}

		const result = await pool.query(
			`INSERT INTO CASHOUTS (username, amount, percentage_cut, date_registered, status, guild)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
			[username, amount, percentage_cut, date_registered, status || 'pending', guild]
		);

		return json({
			success: true,
			cashout: result.rows[0]
		});
	} catch (err) {
		console.error('Database error:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
