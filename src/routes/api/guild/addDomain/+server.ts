import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { pool } from '$lib/db/config';

export async function POST({ request }: RequestEvent) {
	try {
		const { url, template, guild } = await request.json();

		// Validate required fields
		if (!url || !template || !guild) {
			return json({ success: false, error: 'Missing required fields' }, { status: 400 });
		}

		// Insert new domain into GUILDDOMAINS table
		const query = `
            INSERT INTO GUILDDOMAINS (url, template, guild)
            VALUES ($1, $2, $3)
            RETURNING id`;
		const values = [url, template, guild];

		const result = await pool.query(query, values);
		const newDomainId = result.rows[0].id;

		return json({
			success: true,
			message: 'Domain added successfully',
			domain: {
				ID: newDomainId,
				URL: url,
				Template: template,
				guild: guild
			}
		});
	} catch (error) {
		console.error('Error adding domain:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
