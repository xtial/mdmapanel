import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { pool } from '$lib/db/config';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'J2K)2oQ={#F&%&W<~uE~}V%+,,lB0+{8e9ONL9~KXXuye(fQ7]0=~|5 V&uet|/o';

export async function POST({ request }: RequestEvent) {
	try {
		const { username, userid, password, rank, starting_page, guild } = await request.json();
		const cookies = request.headers.get('cookie');

		if (!cookies) {
			return json({ error: 'No authorization cookie provided' }, { status: 401 });
		}

		const authToken = cookies
			.split('; ')
			.find((row) => row.startsWith('authTokenAdmin='))
			?.split('=')[1];

		if (!authToken) {
			return json({ error: 'No authorization token found in cookies' }, { status: 401 });
		}

		let decodedToken;
		try {
			decodedToken = jwt.verify(authToken, JWT_SECRET);
		} catch (err) {
			return json({ error: 'Invalid or expired authorization token' }, { status: 401 });
		}

		if (!username || !userid || !password || !rank || !starting_page || !guild) {
			return json({ success: false, error: 'Missing required parameters' }, { status: 400 });
		}

		const query = `
            INSERT INTO USERS (username, userid, password, rank, starting_page, guild)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

		const result = await pool.query(query, [
			username,
			userid,
			password,
			rank,
			starting_page,
			guild
		]);

		return json({
			success: true,
			user: result.rows[0]
		});
	} catch (err) {
		console.error('Database error:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
