import productList from './productList.json';
export async function getProductHandler() {
	if (!Array.isArray(productList) || !productList.length) {
		return {
			statusCode: 400,
			body: JSON.stringify({
				message: 'Product list is empty',
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		};
	}
	try {
		return {
			statusCode: 200,
			body: JSON.stringify(productList),
			headers: {
				'Content-Type': 'application/json',
			},
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: 'Error occurred while getting products list',
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		};
	}
}
