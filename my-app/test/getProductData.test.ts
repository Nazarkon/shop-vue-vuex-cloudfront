import { getProductHandler } from '../lib/productsLambda/getProductData';
import productList from '../lib/productsLambda/productList.json';

interface ProductListTypes {
	count: number;
	description: string;
	id: string;
	price: number;
	title: string;
}
describe('getProductHandler', () => {
	let data: ProductListTypes[];
	beforeEach(() => {
		data = productList;
	});
	it('Should return a successfull response', async () => {
		const response = await getProductHandler();

		expect(response).toEqual({
			statusCode: 200,
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json',
			},
		});
	});
});
