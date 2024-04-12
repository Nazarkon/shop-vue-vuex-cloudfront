import productList from '../lib/productsLambda/productList.json';
import { getProductByIdHandler } from '../lib/productsLambda/getProductDataById';
interface RequestQueryParams {
	pathParameters: {
		product_id?: string;
	};
}
describe('getProductByIdHandler', () => {
	let event: RequestQueryParams;
	beforeEach(() => {
		event = {
			pathParameters: {
				product_id: productList[0].id,
			},
		};
	});
	it('Should return 400 response when the id is missing', async () => {
		delete event.pathParameters.product_id;

		const response = await getProductByIdHandler(event as any);

		expect(response).toEqual({
			statusCode: 400,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				message: 'Invalid request, you are missing the parameter id',
			}),
		});
	});

	it('Should return 404 response when the product is not found', async () => {
		event.pathParameters.product_id = 'id_that_not_exist';

		const response = await getProductByIdHandler(event as any);

		expect(response).toEqual({
			statusCode: 404,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ message: 'Product not found' }),
		});
	});

	it('Should return 200 response and the product when the product is found', async () => {
		const response = await getProductByIdHandler(event as any);

		expect(response).toEqual({
			statusCode: 200,
			body: JSON.stringify(productList[0]),
			headers: {
				'Content-Type': 'application/json',
			},
		});
	});
});
