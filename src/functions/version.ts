declare const __APP__: string;
declare const __VERSION__: string;

export const handler = async (event: AWSLambda.APIGatewayProxyEvent, context: AWSLambda.APIGatewayEventRequestContext): Promise<any> => ({
  statusCode: 200,
  body: JSON.stringify({
    app: __APP__,
    version: __VERSION__,
    node_version: process.version,
    environment: process.env.NODE_ENV
  }, null, 2)
});
