import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { uuid } from 'uuidv4';
import productsList from './mocks/productsList.json';

const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

const productTableName = process.env.STACK_PRODUCT_DB_NAME;
const stockTableName = process.env.STACK_PRODUCT_STOCK_DB_NAME;

async function prePopulateTables() {
	console.log(productTableName);
	console.log(stockTableName);
	for (const product of productsList) {
		console.log(product);
		const productId = uuid();

		try {
			await docClient.send(
				new PutCommand({
					TableName: productTableName,
					Item: {
						id: productId,
						title: product.title,
						description: product.description,
						price: product.price,
					},
				})
			);

			const stockCount = Math.floor(Math.random() * 99);

			await docClient.send(
				new PutCommand({
					TableName: stockTableName,
					Item: {
						product_id: productId,
						count: stockCount,
					},
				})
			);
		} catch (error) {
			console.error('Error populating tables:', error);
		}
	}
}

prePopulateTables();
