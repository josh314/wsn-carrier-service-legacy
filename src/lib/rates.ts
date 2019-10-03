import * as shopify from 'shopify';

/*********************************************
 * Types
 * 
 * *******************/

export interface RateRequestBody {
  rate: RateRequest
}
export interface RateRequest {
  origin: Location,
  destination: Location,
  items: Array<Item>,
  currency: string,
  locale: string
}
interface Location {
  country: string | null,
  postal_code: string | null,
  province: string | null,
  city: string | null,
  name: string | null,
  address1: string | null,
  address2: string | null,
  address3: string | null,
  phone: string | null,
  fax: string | null,
  email: string | null,
  address_type: string | null,
  company_name: string | null
}
interface Item {
  name: string | null,
  sku: string | null,
  quantity: number,
  grams: number,
  price: number,
  vendor: string | null,
  requires_shipping: boolean,
  taxable: boolean,
  fulfillment_service: string | null,
  properties: string | null,
  product_id: number,
  variant_id: number
}

export interface RateResponse {
  rates: Array<Rate>
}

export interface Rate {
  service_name: string,
  description: string,
  service_code: string,
  currency: string
  total_price: string,
  phone_required?: boolean,
  min_delivery_date?: string,
  max_delivery_date?: string
}

const shopifyClient: shopify.Client = new shopify.Client({
  store: process.env.SHOPIFY_STORE_NAME,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
});

/**********************************************
 * Functions
 * 
 * ********************************************/

function computeRateFromProducts(products: Array<shopify.Product>): number {
  return 3000*products.length;
}

export async function getSampleRate(): Promise<RateResponse> {
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

export async function getRate(rateReq: RateRequest): Promise<RateResponse> {
  let resp: RateResponse;
  try{
    const items: Array<Item> = rateReq.items;
    const productVariantIds: Array<number> = items.map( x => x.variant_id );
    const products: Array<shopify.Product> = await shopifyClient.getProductData(productVariantIds);

    if(process.env.DEBUG) {
      console.log('Product data:');
      console.log(products);
    }

    resp = {
      rates: []
    };

    const rate: Rate = {
      service_name: 'Fast, Convenient Shipping',
      description: 'Includes tracking.',
      service_code: 'wholesaleninjas_shipping', //TODO!
      currency: 'USD',
      total_price: computeRateFromProducts(products).toString(),
    };

    resp.rates.push(rate);

    return resp;
  }
  catch(e) {
    throw new Error(`Failure: Server error in \`getRate\`: ${e}`);
    // return getSampleRate();
  }
}
