import productList from './productList.json';

interface RequestQueryParams {
	pathParameters: {
		product_id: string;
	};
}

export async function getProductByIdHandler(event: RequestQueryParams) {
	if (!event.pathParameters.product_id) {
		console.log(event.pathParameters.product_id, 'Event');
		return {
			statusCode: 400,
			body: JSON.stringify({
				message: `Invalid request, you are missing the parameter product_id`,
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		};
	}

	try {
		const product = productList.filter(
			product => product.id == event.pathParameters.product_id
		);

		if (product.length === 0) {
			return {
				statusCode: 404,
				body: JSON.stringify({ message: 'Product not found' }),
				headers: {
					'Content-Type': 'application/json',
				},
			};
		}

		return {
			statusCode: 200,
			body: JSON.stringify(product[0]),
			headers: {
				'Content-Type': 'application/json',
			},
		};
	} catch (error) {
		return {
			statusCode: 400,
			body: JSON.stringify({ message: 'Error occurred', error }),
			headers: {
				'Content-Type': 'application/json',
			},
		};
	}
}
