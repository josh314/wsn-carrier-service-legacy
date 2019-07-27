export const handler = (event, context, callback) => {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      app: 'wsn-carrier-service',
      node: process.version
    }, null, 2)
  });
};