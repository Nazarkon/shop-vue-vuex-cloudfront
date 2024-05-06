import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

const productTableName = process.env.STACK_PRODUCT_DB_NAME;
const stockTableName = process.env.STACK_PRODUCT_STOCK_DB_NAME;

export async function getProductHandler() {
	try {
		const productTableScan = new ScanCommand({
			TableName: productTableName,
		});
		const productCommandResponse = await docClient.send(productTableScan);
		const productData = productCommandResponse.Items;

		const stocksTableScan = new ScanCommand({
			TableName: stockTableName,
		});
		const stocksCommandResponse = await docClient.send(stocksTableScan);
		const stocksData = stocksCommandResponse.Items;

		const mergedResponse = productData?.map(product => {
			const stockItem = stocksData?.find(
				item => item.product_id === product.id
			);
			return {
				...product,
				count: stockItem?.count || 0,
			};
		});
		return {
			statusCode: 200,
			body: JSON.stringify(mergedResponse),
			headers: {
				'Content-Type': 'application/json',
			},
		};
	} catch (error) {
		return {
			...metaData,
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
