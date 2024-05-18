interface Event {
	methodArn: string;
	headers: { username: string; password: string };
}

interface AuthResponse {
	principalId: string;
	policyDocument?: PolicyDocument;
	context?: Context;
}

interface PolicyDocument {
	Version: string;
	Statement: Statement[];
}

interface Statement {
	Action: string;
	Effect: string;
	Resource: string;
}

interface Context {
	stringKey: string;
	numberKey: number;
	booleanKey: boolean;
}

export const importServiceAuthorizerHandler = (
	event: Event,
	context: any,
	// eslint-disable-next-line @typescript-eslint/ban-types
	callback: Function
) => {
	console.log('Received event:', JSON.stringify(event, null, 2));
	const headers = event.headers;

	const tmp = event.methodArn.split(':');
	const apiGatewayArnTmp = tmp[5].split('/');
	const resource = apiGatewayArnTmp[3] ? `${apiGatewayArnTmp[3]}` : '/';

	if (!headers.username || !headers.password) {
		callback(
			null,
			generateAllow('Authorization header is not provided', event.methodArn)
		);
	}

	const savedPassword = process.env[headers.username.trim()];

	if (savedPassword === headers.password.trim()) {
		callback(null, generateAllow('Access is granted', event.methodArn));
	} else {
		callback(null, generateDeny('Unauthorized', resource));
	}
};

const generatePolicy = (
	principalId: string,
	effect: string,
	resource: string
): AuthResponse => {
	const authResponse = {} as AuthResponse;
	authResponse.principalId = principalId;
	if (effect && resource) {
		const policyDocument = {} as PolicyDocument;
		policyDocument.Version = '2012-10-17';
		policyDocument.Statement = [];
		const statementOne = {} as Statement;
		statementOne.Action = 'execute-api:Invoke';
		statementOne.Effect = effect;
		statementOne.Resource = resource;
		policyDocument.Statement[0] = statementOne;
		authResponse.policyDocument = policyDocument;
	}
	authResponse.context = {
		stringKey: 'stringval',
		numberKey: 123,
		booleanKey: true,
	};
	return authResponse;
};

const generateAllow = (principalId: string, resource: string) => {
	return generatePolicy(principalId, 'Allow', resource);
};

const generateDeny = (principalId: string, resource: string) => {
	return generatePolicy(principalId, 'Deny', resource);
};
