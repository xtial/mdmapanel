import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { pool } from '$lib/db/config';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'J2K)2oQ={#F&%&W<~uE~}V%+,,lB0+{8e9ONL9~KXXuye(fQ7]0=~|5 V&uet|/o';

export async function POST({ request }: RequestEvent) {
	try {
		const { username, starting_page } = await request.json();
		const cookies = request.headers.get('cookie');

		if (!cookies) {
			return json({ success: false, error: 'No authorization cookie provided' }, { status: 401 });
		}

		const authToken = cookies
			.split('; ')
			.find((row) => row.startsWith('authToken='))
			?.split('=')[1];

		if (!authToken) {
			return json(
				{ success: false, error: 'No authorization token found in cookies' },
				{ status: 401 }
			);
		}

		const decodedToken = jwt.verify(authToken, JWT_SECRET) as { userName: string };

		if (decodedToken.userName !== username) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		if (!username || !starting_page) {
			return json(
				{ success: false, error: 'Username and starting page are required' },
				{ status: 400 }
			);
		}

		const query = `
            UPDATE USERS 
            SET starting_page = $2
            WHERE username = $1
            RETURNING *
        `;

		const result = await pool.query(query, [username, starting_page]);

		if (result.rows.length === 0) {
			return json({ success: false, error: 'User not found' }, { status: 404 });
		}

		return json({
			success: true,
			message: 'Starting page updated successfully',
			user: result.rows[0]
		});
	} catch (err) {
		console.error('Database error:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
