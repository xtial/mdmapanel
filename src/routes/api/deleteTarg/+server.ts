import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { pool } from '$lib/db/config';

export async function POST({ request }: RequestEvent) {
	try {
		const { targID } = await request.json();

		const query = 'DELETE FROM targets WHERE id = $1';
		await pool.query(query, [targID]);

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting target:', error);
		return json({ success: false, error: 'Failed to delete target' }, { status: 500 });
	}
}
