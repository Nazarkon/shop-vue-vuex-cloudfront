import {
	S3Client,
	GetObjectCommand,
	CopyObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import csvParser from 'csv-parser';
import { promisify } from 'util';
import { pipeline, Writable, Readable } from 'stream';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const promisifiedPipeline = promisify(pipeline);

const client = new S3Client({ region: 'us-east-1' });

const sqsClient = new SQSClient({ region: 'us-east-1' });
const sqsQueueUrl = process.env.SQS_QUEUE_URL; // replace with your queue URL

async function moveCSVFile(
	bucketName: string,
	objKey: string,
	destinationFolder: string
) {
	const fileName = objKey.split('/').pop();
	const destinationKey = `${destinationFolder}/${fileName}`;

	console.log(fileName, 'fileName');
	console.log(destinationKey, 'destinationKey');
	try {
		// Copy our File
		await client.send(
			new CopyObjectCommand({
				Bucket: bucketName,
				CopySource: `${bucketName}/${objKey}`,
				Key: destinationKey,
			})
		);
		// delete file from another folder
		await client.send(
			new DeleteObjectCommand({
				Bucket: bucketName,
				Key: objKey,
			})
		);
		console.log('File successfully copied from Upload folder to Parsed');
	} catch (err) {
		console.error(err);
		console.log('Something went wrong when we copy CSV file top a new folder');
	}
}

const processCSVFile = async (bucket: string, objKey: string) => {
	try {
		const incomingData = await client.send(
			new GetObjectCommand({
				Bucket: bucket,
				Key: objKey,
			})
		);
		if (incomingData.Body instanceof Readable) {
			await promisifiedPipeline(
				incomingData.Body,
				csvParser(),
				new Writable({
					objectMode: true,
					write: async (chunk, encoding, callback) => {
						try {
							await sqsClient.send(
								new SendMessageCommand({
									QueueUrl: sqsQueueUrl,
									MessageBody: JSON.stringify(chunk),
								})
							);
							console.log('Message to SQS successfully send');
							callback();
						} catch (error) {
							console.log(error);
							callback();
						}
					},
				})
			);
			console.log(`File Succesfully proceed ${objKey}`);
		}
	} catch (err) {
		console.error('Something went wrong', err);
		throw err;
	}
};

export async function importFileParserHandler(event: any): Promise<void> {
	for (const record of event.Records) {
		const bucketName = record.s3.bucket.name;
		const objectKey = decodeURIComponent(
			record.s3.object.key.replace(/\+/g, ' ')
		);

		console.log(bucketName, 'bucketName');
		console.log(objectKey, 'objectKey');

		try {
			await processCSVFile(bucketName, objectKey);

			console.log(`CSV File ${objectKey} was proceeded`);

			await moveCSVFile(bucketName, objectKey, 'parsed');

			console.log(`File was moved`);
		} catch (error) {
			console.error('Error processing/moving file:', error);
			throw error;
		}
	}
}
