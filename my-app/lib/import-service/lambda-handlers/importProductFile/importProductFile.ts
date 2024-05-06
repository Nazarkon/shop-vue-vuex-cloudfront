/* eslint-disable @typescript-eslint/no-explicit-any */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import 'dotenv/config';

const s3Client = new S3Client({ region: process.env.REGION });

export async function importProductSignedURLHandler(event: any) {
	console.log(event, 'event');

	const { fileName } = event.pathParameters;

	const s3PutCommand = new PutObjectCommand({
		Bucket: 'import-product-service-bucket',
		Key: `upload/${fileName}`,
		ContentType: 'text/csv',
	});

	try {
		const signedURL = await getSignedUrl(s3Client, s3PutCommand, {
			expiresIn: 4000,
		});

		return {
			statusCode: 200,
			body: JSON.stringify({ url: signedURL }),
			headers: {
				'Content-Type': 'application/json',
			},
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: 'Failed to create S3 SignedURL',
			}),
		};
	}
}
