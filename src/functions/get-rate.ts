import { RateRequest, RateRequestBody } from 'rate-request';

import { Rate, ComputeRateOptions, computeRates } from 'rates';

/**************************************************
 * Types
 * 
 ***************************************/

interface RateResponse {
  rates: Array<Rate>
}

/****************************************** 
 * Handler
 * 
 * ******************************/

export const handler = async (event: AWSLambda.APIGatewayProxyEvent, context: AWSLambda.APIGatewayEventRequestContext): Promise<any> => {
  let rateRequestBody: RateRequestBody;
  try{
    if(process.env.DEBUG) {
      console.log('event:');
      console.log(JSON.stringify(event,null,2));
    }
    let resp: RateResponse;
    if (event.httpMethod.toUpperCase() === 'POST' && event.body) {
      rateRequestBody = JSON.parse(event.body);
      resp = await getRate(rateRequestBody.rate);
    }
    else if (event.httpMethod.toUpperCase() === 'GET') {
      resp = await getSampleRate();
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


async function getSampleRate(): Promise<RateResponse> {
  let resp: RateResponse;
  try{

    resp = {
      rates: []
    };

    const rate: Rate = {
      service_name: 'Fast, Convenient Shipping',
      description: 'Includes tracking. Sample response',
      service_code: 'wholesaleninjas_shipping', //TODO!
      currency: 'USD',
      total_price: '10.00',
    };

    resp.rates.push(rate);

    return resp;
  }
  catch(e) {
    throw new Error(`Failure: Server error in \`getSampleRate\`: ${e}`);
  }
}

async function getRate(rateReq: RateRequest): Promise<RateResponse> {
  let resp: RateResponse;
  try{

    const computeRateOpts: ComputeRateOptions = {
      destination: rateReq.destination,
      items: rateReq.items
    };

    resp = {
      rates: await computeRates(computeRateOpts)
    };

    return resp;
  }
  catch(e) {
    throw new Error(`Failure: Server error in \`getRate\`: ${e}`);
    // return getSampleRate();
  }
}