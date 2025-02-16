import type { RequestHandler } from '@sveltejs/kit';
import { pool } from '$lib/db/config';

export const GET: RequestHandler = async ({ params }) => {
	const { targetid } = params;

	try {
		const result = await pool.query('SELECT * FROM captureddata WHERE targetid = $1', [targetid]);
		return new Response(JSON.stringify(result.rows), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.error(err);
		return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 });
	}
};
