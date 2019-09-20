export const handler = (event, context, callback) => {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      app: 'wsn-carrier-service',
      version: APP_VERSION,
      node_version: process.version,
    }, null, 2)
  });
};