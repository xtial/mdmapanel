import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'J2K)2oQ={#F&%&W<~uE~}V%+,,lB0+{8e9ONL9~KXXuye(fQ7]0=~|5 V&uet|/o';

import { pool } from '$lib/db/config';

export async function POST({ request, cookies }: RequestEvent) {
	try {
		const { userName, passWord } = await request.json();

		const query = 'SELECT password FROM admins WHERE username = $1';
		const values = [userName];

		const result = await pool.query(query, values);

		if (result.rowCount === 0) {
			return json({ success: false, error: 'Invalid username or password' }, { status: 401 });
		}

		const dbPassword = result.rows[0].password;

		if (passWord !== dbPassword) {
			return json({ success: false, error: 'Invalid username or password' }, { status: 401 });
		}

		const token = jwt.sign({ userName }, SECRET_KEY, { expiresIn: '1h' });

		cookies.set('authTokenAdmin', token, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 3600,
			path: '/'
		});

		// Return success response with the token
		return json({ success: true, token });
	} catch (error) {
		console.error('Error during authentication:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
