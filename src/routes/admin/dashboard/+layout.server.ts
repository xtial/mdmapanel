import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import type { RequestEvent } from '@sveltejs/kit';

const SECRET_KEY = 'J2K)2oQ={#F&%&W<~uE~}V%+,,lB0+{8e9ONL9~KXXuye(fQ7]0=~|5 V&uet|/o'; // Replace with an environment variable for production

export function load({ cookies }: RequestEvent) {
	const token = cookies.get('authTokenAdmin');

	if (!token) {
		throw redirect(303, 'login'); // Redirect to login if no token
	}

	try {
		// Verify the token
		jwt.verify(token, SECRET_KEY);
	} catch (error) {
		throw redirect(303, 'login'); // Redirect if token is invalid
	}

	// Allow access if token is valid
	return {};
}
