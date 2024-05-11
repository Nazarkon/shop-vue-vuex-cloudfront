import { SNSEvent } from 'aws-lambda';

export async function createProductTopicHandler(event: SNSEvent) {
	console.log('Received message:', event.Records[0].Sns.Message);

}
