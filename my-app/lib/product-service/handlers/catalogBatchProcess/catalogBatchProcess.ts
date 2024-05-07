import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { uuid } from 'uuidv4';

const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

const snsClient = new SNSClient({ region: process.env.REGION });

const productTableName = process.env.STACK_PRODUCT_DB_NAME;
const stockTableName = process.env.STACK_PRODUCT_STOCK_DB_NAME;

interface ProductData {
	title: string;
	description: string;
	price: number;
	count: number;
}

async function createProductRecords(data: ProductData[]) {
	const productRequests = data.map(
		async ({ title, description, price, count }) => {
			const productId = uuid();
			const putProductCommand = new PutCommand({
				TableName: productTableName,
				Item: {
					id: productId,
					title,
					description,
					price,
				},
			});

			try {
				await docClient.send(putProductCommand);
				console.log(`Product with id ${productId} added successfully`);

				await snsClient.send(
					new PublishCommand({
						TopicArn: process.env.SNS_ARN,
						Message: `New product created: ${JSON.stringify({
							id: productId,
							title,
							description,
							price,
						})}`,
						Subject: 'New Product Creation Notification',
					})
				);
			} catch (err) {
				console.log(`Error adding product with id ${productId}: ${err}`);
			}

			const putStockCommand = new PutCommand({
				TableName: stockTableName,
				Item: {
					product_id: productId,
					count,
				},
			});

			try {
				await docClient.send(putStockCommand);
				console.log(`Stock for product id ${productId} added successfully`);
			} catch (err) {
				console.log(`Error adding stock for product id ${productId}: ${err}`);
			}
		}
	);

	return Promise.all(productRequests);
}

export async function catalogBatchProcessHandler(event: SQSEvent) {
	if (!event.Records || event.Records.length === 0) {
		console.error('Records stream is empty');
		return;
	}
	try {
		const records = event.Records.map(record => JSON.parse(record.body));
		await createProductRecords(records);
		console.log('SNS messages with products were successfully saved');
	} catch (err) {
		console.log('Smth went wrong');
	}
}
