import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { uuid } from 'uuidv4';

const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

const productTableName = process.env.STACK_PRODUCT_DB_NAME;
const stockTableName = process.env.STACK_PRODUCT_STOCK_DB_NAME;

interface RequestBodyParams {
	body: string;
}

export async function createProductHandler(event: RequestBodyParams) {
	const { title, description, price, count } = JSON.parse(event.body);

	const metaData = {
		headers: {
			'Access-Control-Allow-Origin': 'http://localhost:3000',
		},
	};

	if (!title || !description || !price || !count) {
		return {
			...metaData,
			statusCode: 400,
			body: JSON.stringify({
				message: 'Product was not created. Some fields are missing',
			}),
		};
	}

	const productId = uuid();

	try {
		const putProductCommand = new PutCommand({
			TableName: productTableName,
			Item: {
				id: productId,
				title,
				description,
				price,
			},
		});
		await docClient.send(putProductCommand);
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: 'Failed to add a product to Product Table',
			}),
		};
	}

	try {
		const putStockCommand = new PutCommand({
			TableName: stockTableName,
			Item: {
				product_id: productId,
				count,
			},
		});
		await docClient.send(putStockCommand);
	} catch (error) {
		return {
			...metaData,
			statusCode: 500,
			body: JSON.stringify({
				message: 'Failed to add a product to Stock Table',
			}),
		};
	}

	return {
		...metaData,
		statusCode: 201,
		body: JSON.stringify({
			message: 'Product successfully created',
			data: event.body,
		}),
		headers: {
			'Content-Type': 'application/json',
		},
	};
}
