import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { pool } from '$lib/db/config';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'J2K)2oQ={#F&%&W<~uE~}V%+,,lB0+{8e9ONL9~KXXuye(fQ7]0=~|5 V&uet|/o';

export async function POST({ request }: RequestEvent) {
	try {
		const { username } = await request.json();
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

		const query = 'DELETE FROM targets WHERE belongsto = $1';
		await pool.query(query, [username]);

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting targets:', error);
		return json({ success: false, error: 'Failed to delete targets' }, { status: 500 });
	}
}
