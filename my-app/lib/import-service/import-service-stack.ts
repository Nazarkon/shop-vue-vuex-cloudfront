import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('node:path');
import * as sqs from 'aws-cdk-lib/aws-sqs';
import 'dotenv/config';

export class ImportServiceStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const productSQS = sqs.Queue.fromQueueArn(
			this,
			'catalogItemsQueue',
			process.env.SQS_QUEUE_ARN || ''
		);

		const bucket = new s3.Bucket(this, 'ImportProductServiceBucket', {
			bucketName: 'import-product-service-bucket',
			versioned: true,
			publicReadAccess: false,
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			autoDeleteObjects: true,
		});

		new s3deploy.BucketDeployment(this, 'DeployUploaded', {
			sources: [s3deploy.Source.asset(path.join(__dirname, './uploaded'))],
			destinationBucket: bucket,
			destinationKeyPrefix: 'uploaded', // optional prefix in destination bucket
		});

		const getProductSignedURL = new lambda.Function(
			this,
			'importProductFileLabmda',
			{
				runtime: lambda.Runtime.NODEJS_20_X,
				memorySize: 1024,
				timeout: cdk.Duration.seconds(5),
				handler: 'importProductFile.importProductSignedURLHandler',
				code: lambda.Code.fromAsset(
					path.join(__dirname, './lambda-handlers/importProductFile')
				),
			}
		);

		const getParsedFileLambda = new lambda.Function(this, 'importFileParser', {
			runtime: lambda.Runtime.NODEJS_20_X,
			memorySize: 1024,
			timeout: cdk.Duration.seconds(5),
			handler: 'importFileParser.importFileParserHandler',
			code: lambda.Code.fromAsset(
				path.join(__dirname, './lambda-handlers/importFileParser')
			),
		});
		productSQS.grantSendMessages(getParsedFileLambda);
		// Set rights to perform delete and Copy operation
		bucket.grantRead(getParsedFileLambda);
		bucket.grantDelete(getParsedFileLambda);
		bucket.grantPut(getParsedFileLambda);
		// set notification for lambda function to call when csv loaded
		bucket.addEventNotification(
			s3.EventType.OBJECT_CREATED,
			new s3n.LambdaDestination(getParsedFileLambda),
			{ prefix: 'uploaded/' }
		);

		bucket.grantRead(getProductSignedURL);

		// Grant put permission
		bucket.grantPut(getProductSignedURL);

		const S3BucketApiGateWay = new apigateway.RestApi(
			this,
			's3-bucket-lambda-function',
			{
				restApiName: 'API Geteway for S3 Bucket',
				description:
					'This API serves the Lambda function that a resposible for uploading and retriving data ',
			}
		);

		const productGetFileSignedURL = new apigateway.LambdaIntegration(
			getProductSignedURL,
			{}
		);

		const getSignedUrlResource =
			S3BucketApiGateWay.root.addResource('{fileName}');

		getSignedUrlResource.addMethod('GET', productGetFileSignedURL);
	}
}
