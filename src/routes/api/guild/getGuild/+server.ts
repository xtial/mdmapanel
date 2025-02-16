import { json } from '@sveltejs/kit';
import { pool } from '$lib/db/config';

export async function GET({ url }) {
	try {
		const username = url.searchParams.get('username');

		if (!username) {
			return json({ error: 'Username parameter is required' }, { status: 400 });
		}

		const query = 'SELECT guild FROM USERS WHERE username = $1';
		const result = await pool.query(query, [username]);

		if (result.rows.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json({
			guild: result.rows[0].guild
		});
	} catch (error) {
		console.error('Database error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
