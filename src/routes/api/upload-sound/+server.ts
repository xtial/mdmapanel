import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'J2K)2oQ={#F&%&W<~uE~}V%+,,lB0+{8e9ONL9~KXXuye(fQ7]0=~|5 V&uet|/o';

export async function POST(event: RequestEvent) {
	try {
		const formData = await event.request.formData();
		const soundFile = formData.get('sound') as File;
		const soundName = formData.get('name') as string;
		const username = formData.get('username') as string;

		const cookies = event.request.headers.get('cookie');

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

		if (!soundFile || !soundName || !username) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		if (!soundFile.type.startsWith('audio/')) {
			return json({ error: 'Invalid file type. Must be audio.' }, { status: 400 });
		}

		const uploadsDir = path.join(process.cwd(), 'static', 'uploads', username);
		fs.mkdirSync(uploadsDir, { recursive: true });

		const existingFiles = fs.readdirSync(uploadsDir);
		for (const file of existingFiles) {
			if (file.endsWith('.mp3')) {
				fs.unlinkSync(path.join(uploadsDir, file));
			}
		}

		const randomName = crypto.randomBytes(16).toString('hex');
		const fileName = `${randomName}.mp3`;

		const arrayBuffer = await soundFile.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const filePath = path.join(uploadsDir, fileName);
		fs.writeFileSync(filePath, buffer);

		const mappingPath = path.join(uploadsDir, 'sound-mappings.json');
		const mappings: Record<string, string> = {
			[soundName]: fileName
		};
		fs.writeFileSync(mappingPath, JSON.stringify(mappings, null, 2));

		return json({
			success: true,
			message: 'Sound uploaded successfully',
			fileName: fileName,
			displayName: soundName
		});
	} catch (error) {
		console.error('Error uploading sound:', error);
		return json(
			{
				error: 'Internal server error'
			},
			{ status: 500 }
		);
	}
}
