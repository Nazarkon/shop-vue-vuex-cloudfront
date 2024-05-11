export async function basicAuthorizerHandler(event: any) {
	const { username, password } = event.headers;
	if (!username || !password) {
		const body = JSON.stringify({
			message: 'Authorization header is not provided',
		});

		return {
			statusCode: 401,
			body,
		};
	}

	const savedPassword = process.env[username.trim()];

	console.log(savedPassword !== password.trim());

	if (savedPassword !== password.trim()) {
		const body = JSON.stringify({ message: 'Access is denied for this user' });

		return {
			statusCode: 403,
			body,
		};
	}

	const body = JSON.stringify({ message: 'Access is granted' });

	return {
		statusCode: 200,
		body,
	};
}
