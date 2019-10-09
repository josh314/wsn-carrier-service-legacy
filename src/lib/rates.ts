import { Location, OrderItem } from 'rate-request';

import * as shopify from 'shopify';

/*********************************************
 * Types
 * 
 * *******************/

export interface ComputeRateOptions {
  destination: Location,
  items: Array<OrderItem>
}

/********************************************************************
 * Initialization
 *
 * *******************/

const shopifyClient: shopify.Client = new shopify.Client({
  store: process.env.SHOPIFY_STORE_NAME,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
});

/**********************************************
 * Functions
 * 
 * ********************************************/

export async function compute(opts: ComputeRateOptions): Promise<number> {
  const items: Array<OrderItem> = opts.items;
  const productVariantIds: Array<number> = items.map( x => x.variant_id );
  const products: Array<shopify.Product> = await shopifyClient.getProductData(productVariantIds);

  if(process.env.DEBUG) {
    console.log('Product data:');
    console.log(products);
  }

  return 3000;
}
