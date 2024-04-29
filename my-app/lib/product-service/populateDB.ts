import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { uuid } from 'uuidv4';
import productList from './mocks/productsList.json';
import 'dotenv/config';

const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

const productTableName = process.env.STACK_PRODUCT_DB_NAME;
const stockTableName = process.env.STACK_PRODUCT_STOCK_DB_NAME;

async function populateDB() {
	const putCommands = productList.map(product => {
		const productId = uuid();
		// PutCommand for products table
		const productPutCommand = docClient.send(
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
		// PutCommand for stocks table
		const stockPutCommand = docClient.send(
			new PutCommand({
				TableName: stockTableName,
				Item: {
					product_id: productId,
					count: stockCount,
				},
			})
		);
		return Promise.all([productPutCommand, stockPutCommand]);
	});
	await Promise.all(putCommands);
}

populateDB().catch(error => {
	console.error('Something went wrong', error);
});
