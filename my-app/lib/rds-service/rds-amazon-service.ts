import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as path from 'path';

const dbUsername = 'Nazarkon';
const dbName = 'rdsServiceDb';
const port = 5432;

export class RDSServiceStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const rdsVPC = new ec2.Vpc(this, 'CustomRDSVPC', {
			maxAzs: 3,
			subnetConfiguration: [
				{
					name: 'Isolated',
					subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
				},
				{
					name: 'Private',
					subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
				},
				{
					name: 'Public',
					subnetType: ec2.SubnetType.PUBLIC,
				},
			],
		});

		const ownRDSSecret = new secretsmanager.Secret(this, 'RdsSecret', {
			secretName: id + '-rds-credentials',
			generateSecretString: {
				secretStringTemplate: JSON.stringify({ username: dbUsername }),
				generateStringKey: 'password',
				excludePunctuation: true,
				includeSpace: false,
			},
		});

		const lambdaSecurityGroup = new ec2.SecurityGroup(
			this,
			'Security Group for Lamnda',
			{
				vpc: rdsVPC,
			}
		);

		const rdsSecurityGroup = new ec2.SecurityGroup(
			this,
			'Security Group for lambda Instance',
			{
				vpc: rdsVPC,
			}
		);
		rdsSecurityGroup.addIngressRule(
			lambdaSecurityGroup,
			ec2.Port.tcp(port),
			'allow db connections from the lambda'
		);

		const rdsCredentials = rds.Credentials.fromSecret(ownRDSSecret);

		const dataBaseInstance = new rds.DatabaseInstance(this, 'MyRdsInstance', {
			engine: rds.DatabaseInstanceEngine.POSTGRES,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			credentials: rdsCredentials,
			instanceType: ec2.InstanceType.of(
				ec2.InstanceClass.T3,
				ec2.InstanceSize.MICRO
			),
			databaseName: dbName,
			vpc: rdsVPC,
			vpcSubnets: {
				subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
			},
			securityGroups: [rdsSecurityGroup],
		});

		const functionName = 'MyNestJsFunction';
		const functionHandler = 'main.handler';

		const myNestJsLambda = new lambdaNode.NodejsFunction(this, functionName, {
			memorySize: 1024,
			timeout: cdk.Duration.seconds(5),
			runtime: lambda.Runtime.NODEJS_20_X,
			entry: path.join(__dirname, 'lambda-nestjs/src', 'main.ts'),
			handler: 'handler',
			environment: {
				DBHOST: dataBaseInstance.dbInstanceEndpointAddress,
				DBNAME: dbName,
				USER: dbUsername,
				DBPORT: dataBaseInstance.dbInstanceEndpointPort,
				PASSWORD: rdsCredentials.password?.unsafeUnwrap() as string,
			},
			vpc: rdsVPC,
			vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
			securityGroups: [lambdaSecurityGroup],
			depsLockFilePath: path.join(
				__dirname,
				'lambda-nestjs',
				'package-lock.json'
			),
			bundling: {
				nodeModules: ['pg', 'pg-hstore'],
				externalModules: [
					'class-transformer',
					'@nestjs/websockets/socket-module',
					'@nestjs/microservices/microservices-module',
					'@nestjs/microservices',
					'cache-manager',
					'class-validator',
				],
			},
		});

		dataBaseInstance.grantConnect(myNestJsLambda, dbUsername);

		new apigateway.LambdaRestApi(this, 'NestJsEndpoint', {
			handler: myNestJsLambda,
		});
	}
}
