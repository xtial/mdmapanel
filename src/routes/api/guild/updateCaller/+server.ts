import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { pool } from '$lib/db/config';

export async function POST({ request }: RequestEvent) {
	try {
		const { username, userid, password, rank, starting_page, guild } = await request.json();

		if (!username || !userid || !rank || !starting_page || !guild) {
			return json({ success: false, error: 'Missing required parameters' }, { status: 400 });
		}

		let query: string;
		let values: any[];

		if (password) {
			query = `
                UPDATE USERS 
                SET username = $1, 
                    userid = $2, 
                    password = $3, 
                    rank = $4, 
                    starting_page = $5
                WHERE guild = $6 AND username = $1
                RETURNING *
            `;
			values = [username, userid, password, rank, starting_page, guild];
		} else {
			query = `
                UPDATE USERS 
                SET userid = $1, 
                    rank = $2, 
                    starting_page = $3
                WHERE guild = $4 AND username = $5
                RETURNING *
            `;
			values = [userid, rank, starting_page, guild, username];
		}

		const result = await pool.query(query, values);

		if (result.rowCount === 0) {
			return json({ success: false, error: 'User not found' }, { status: 404 });
		}

		return json({
			success: true,
			user: result.rows[0]
		});
	} catch (err) {
		console.error('Database error:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
