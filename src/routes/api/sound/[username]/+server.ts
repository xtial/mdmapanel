import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'J2K)2oQ={#F&%&W<~uE~}V%+,,lB0+{8e9ONL9~KXXuye(fQ7]0=~|5 V&uet|/o';

export async function GET({ params, request }: RequestEvent) {
	try {
		const { username } = params;
		const cookies = request.headers.get('cookie');

		if (!cookies) {
			return json({ error: 'No authorization cookie provided' }, { status: 401 });
		}

		const authToken = cookies
			.split('; ')
			.find((row) => row.startsWith('authToken='))
			?.split('=')[1];

		if (!authToken) {
			return json({ error: 'No authorization token found in cookies' }, { status: 401 });
		}

		const decodedToken = jwt.verify(authToken, JWT_SECRET) as { userName: string };

		if (decodedToken.userName !== username) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (!username) {
			return json({ error: 'Username is required' }, { status: 400 });
		}

		const uploadsDir = path.join(process.cwd(), 'static', 'uploads', username);
		const mappingPath = path.join(uploadsDir, 'sound-mappings.json');

		if (!fs.existsSync(mappingPath)) {
			return json({ error: 'No custom sound found' }, { status: 404 });
		}

		const mappings = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

		const soundNames = Object.keys(mappings);
		if (soundNames.length === 0) {
			return json({ error: 'No custom sound found' }, { status: 404 });
		}

		const latestSoundName = soundNames[soundNames.length - 1];
		const fileName = mappings[latestSoundName];

		const soundUrl = `/uploads/${username}/${fileName}`;

		return json({
			soundUrl,
			displayName: latestSoundName
		});
	} catch (error) {
		console.error('Error getting sound:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
