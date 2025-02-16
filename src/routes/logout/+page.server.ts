import { redirect } from '@sveltejs/kit';

export const load = async ({ cookies }) => {
	cookies.delete('authToken', { path: '/' });
	throw redirect(303, '/login');
};
