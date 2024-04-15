import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';

export class ProductDataLambdaStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const getProductDataLambda = new lambda.Function(this, 'getProductData', {
			runtime: lambda.Runtime.NODEJS_20_X,
			memorySize: 1024,
			timeout: cdk.Duration.seconds(5),
			handler: 'getProductData.getProductHandler',
			code: lambda.Code.fromAsset(path.join(__dirname, './')),
		});
		const getProductDataByIdLambda = new lambda.Function(
			this,
			'getProductById',
			{
				runtime: lambda.Runtime.NODEJS_20_X,
				memorySize: 1024,
				timeout: cdk.Duration.seconds(5),
				handler: 'getProductDataById.getProductByIdHandler',
				code: lambda.Code.fromAsset(path.join(__dirname, './')),
			}
		);
		const api = new apigateway.RestApi(this, 'product-data-api', {
			restApiName: 'Api Gateway for products',
			description:
				'This API serves the Lambda functions. Which are responsible for products returning',
		});

		const ProductDataLambdasIntegration = new apigateway.LambdaIntegration(
			getProductDataLambda,
			{}
		);

		const getProductDataByIdLambdaIntegration =
			new apigateway.LambdaIntegration(getProductDataByIdLambda, {});

		const getProductDataResource = api.root.addResource('product');
		getProductDataResource.addMethod('GET', ProductDataLambdasIntegration);

		const getProductByIdResource =
			getProductDataResource.addResource('{product_id}');
		getProductByIdResource.addMethod(
			'GET',
			getProductDataByIdLambdaIntegration
		);
	}
}
