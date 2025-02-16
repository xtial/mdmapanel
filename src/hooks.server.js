export async function handle({ event, resolve }) {
	const response = await resolve(event);

	response.headers.set('Access-Control-Allow-Origin', '*');
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	response.headers.set('Access-Control-Allow-Headers', '*');
	response.headers.set('Access-Control-Allow-Credentials', 'true');

	if (event.request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: response.headers
		});
	}

	return response;
}
