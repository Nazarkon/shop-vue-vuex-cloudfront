import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { CfnOutput } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('node:path');

export interface StaticSiteProps {
	env: {
		region: string;
		account: string;
	};
}

export class MyGameShopStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: StaticSiteProps) {
		super(scope, id);

		const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
			this,
			'cloudfront-OAI',
			{
				comment: `OAI for ${id}`,
			}
		);

		const siteBucket = new s3.Bucket(this, 'SiteBucket', {
			versioned: true,
			publicReadAccess: false,
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			autoDeleteObjects: true,
		});

		siteBucket.addToResourcePolicy(
			new iam.PolicyStatement({
				actions: ['s3:GetObject'],
				resources: [siteBucket.arnForObjects('*')],
				principals: [
					new iam.CanonicalUserPrincipal(
						cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
					),
				],
			})
		);
		new CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

		const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
			defaultRootObject: 'index.html',
			defaultBehavior: {
				origin: new cloudfront_origins.S3Origin(siteBucket, {
					originAccessIdentity: cloudfrontOAI,
				}),
				compress: true,
				allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
				viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
			},
		});

		new CfnOutput(this, 'CloudFrontLink', {
			value: `https://${distribution.distributionDomainName}`,
		});

		new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
			sources: [s3deploy.Source.asset(path.join(__dirname, '../../build'))],
			destinationBucket: siteBucket,
			distribution: distribution,
		});
	}
}
