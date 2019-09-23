import { getRate, RateRequestBody, RateResponse } from 'rates';

export const handler = async (event: AWSLambda.APIGatewayProxyEvent, context: AWSLambda.APIGatewayEventRequestContext): Promise<any> => {
  try{
    let resp: RateResponse;
    if(event.httpMethod.toUpperCase() === 'POST' && event.body) {
      const body: RateRequestBody = JSON.parse(event.body);
      resp = await getRate(body.rate);
    }

    if(!resp) {
      throw new Error('Invalid request.');
    }

    return {
      statusCode: 200,
      body: JSON.stringify(resp),
    };
  }
  catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: true, message: e.message }),
    };
  }
};