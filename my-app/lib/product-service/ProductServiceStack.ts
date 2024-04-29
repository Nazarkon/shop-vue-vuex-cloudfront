// Filename: todo/TodoStack.ts
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Cors } from 'aws-cdk-lib/aws-apigateway';

const productTableName = process.env.PRODUCT_TABLE_DB_NAME;
const stockTableName = process.env.PRODUCT_TABLE_DB_STOCK_NAME;

export class ProductServiceStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		const ProductTable = new dynamodb.Table(this, 'Products', {
			tableName: productTableName,
			partitionKey: {
				name: 'id',
				type: dynamodb.AttributeType.STRING,
			},
			readCapacity: 1,
			writeCapacity: 1,
		});
		const StockTable = new dynamodb.Table(this, 'Stocks', {
			tableName: stockTableName,
			partitionKey: {
				name: 'product_id',
				type: dynamodb.AttributeType.STRING,
			},
			readCapacity: 1,
			writeCapacity: 1,
		});

		const getProductDataLambda = new lambda.Function(this, 'getProductData', {
			runtime: lambda.Runtime.NODEJS_20_X,
			memorySize: 1024,
			timeout: cdk.Duration.seconds(5),
			handler: 'getProductList.getProductHandler',
			code: lambda.Code.fromAsset(
				path.join(__dirname, './handlers/getProductList')
			),
		});

		ProductTable.grantReadData(getProductDataLambda);
		StockTable.grantReadData(getProductDataLambda);

		const getProductDataByIdLambda = new lambda.Function(
			this,
			'getProductById',
			{
				runtime: lambda.Runtime.NODEJS_20_X,
				memorySize: 1024,
				timeout: cdk.Duration.seconds(5),
				handler: 'getProductById.getProductByIdHandler',
				code: lambda.Code.fromAsset(
					path.join(__dirname, './handlers/getProductById')
				),
			}
		);

		ProductTable.grantReadData(getProductDataByIdLambda);
		StockTable.grantReadData(getProductDataByIdLambda);

		const postProductDataLambda = new lambda.Function(
			this,
			'createProductItem',
			{
				runtime: lambda.Runtime.NODEJS_20_X,
				memorySize: 1024,
				timeout: cdk.Duration.seconds(5),
				handler: 'createProduct.createProductHandler',
				code: lambda.Code.fromAsset(
					path.join(__dirname, './handlers/createProduct')
				),
			}
		);

		ProductTable.grantWriteData(postProductDataLambda);
		StockTable.grantWriteData(postProductDataLambda);

		const api = new apigateway.RestApi(this, 'product-data-api', {
			restApiName: 'Api Gateway for products',
			description:
				'This API serves the Lambda functions. Which are responsible for products returning',
			defaultCorsPreflightOptions: {
				allowOrigins: ['http://localhost:5555'],
				allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
				allowHeaders: Cors.DEFAULT_HEADERS,
			},
		});

		const ProductDataLambdasIntegration = new apigateway.LambdaIntegration(
			getProductDataLambda,
			{}
		);

		const getProductDataByIdLambdaIntegration =
			new apigateway.LambdaIntegration(getProductDataByIdLambda, {});

		const getProductDataResource = api.root.addResource('products');
		getProductDataResource.addMethod('GET', ProductDataLambdasIntegration);

		const getProductByIdResource =
			getProductDataResource.addResource('{product_id}');
		getProductByIdResource.addMethod(
			'GET',
			getProductDataByIdLambdaIntegration
		);

		const postProductDataLambdaIntegration = new apigateway.LambdaIntegration(
			postProductDataLambda,
			{}
		);

		getProductDataResource.addMethod('POST', postProductDataLambdaIntegration);
	}
}
