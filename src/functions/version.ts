declare const __APP__: string;
declare const __VERSION__: string;

export const handler = (event, context, callback) => {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      app: __APP__,
      version: __VERSION__,
      node_version: process.version,
    }, null, 2)
  });
};