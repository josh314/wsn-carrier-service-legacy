import * as shopify from 'shopify';

export const handler = async (event, context) => {
  try{
    if(event.httpMethod.toUpperCase() === 'POST' && event.body) {
      const body = JSON.parse(event.body);
      console.log(body);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        msg: 'Submission successful.',
      }),
    };
  }
  catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: true, mg: 'Server Error.' }),
    };
  }
};