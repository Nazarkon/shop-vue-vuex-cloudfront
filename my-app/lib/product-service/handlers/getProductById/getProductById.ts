import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

const productTableName = process.env.STACK_PRODUCT_DB_NAME;
const stockTableName = process.env.STACK_PRODUCT_STOCK_DB_NAME;

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
		const productTableGet = new GetCommand({
			TableName: productTableName,
			Key: {
				id: event.pathParameters.product_id,
			},
		});

		const productCommandResponse = await docClient.send(productTableGet);
		const productData = productCommandResponse.Item;

		const stockTableGet = new GetCommand({
			TableName: stockTableName,
			Key: {
				product_id: event.pathParameters.product_id,
			},
		});

		const stockCommandResponse = await docClient.send(stockTableGet);
		const stockData = stockCommandResponse.Item;

		const mergedResponse = {
			...productData,
			count: stockData?.count || 0,
		};

		if (!productData) {
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
			body: JSON.stringify(mergedResponse),
			headers: {
				'Content-Type': 'application/json',
			},
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({ message: 'Error occurred', error }),
			headers: {
				'Content-Type': 'application/json',
			},
		};
	}
}
