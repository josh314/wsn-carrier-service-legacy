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

const attachProductToItem = (products: Array<shopify.Product> ) => {
  return (item: OrderItem): void => {
    item.shopifyProduct = products.find( p => item.variant_id === p.variantId );
  };
};

// Shipping in USD for the box lots
const boxLotsShipping = function(items: Array<OrderItem>): number {
  return items.reduce( (total, item) => total + item.quantity, 0)*30;
};

// Shipping in USD for the pallets
const palletsShipping = function(items: Array<OrderItem>): number {
  return items.reduce( (total, item) => total + item.quantity, 0)*180;
};


/*********************************************
* Main
* 
*/
export async function compute(opts: ComputeRateOptions): Promise<number> {
  const items: Array<OrderItem> = opts.items;
  try{
    const productVariantIds: Array<number> = items.map( x => x.variant_id ).filter(x=>x);
    const products: Array<shopify.Product> = await shopifyClient.getProductData(productVariantIds);

    if(process.env.DEBUG) {
      console.log('Product data:');
      console.log(products);
    }

    items.forEach(attachProductToItem(products));
  }
  catch(e) {
    console.log('Error attaching product data to order items.');
    console.log(e);
  }

  const boxLotItems = items.filter( item => item.shopifyProduct ? item.shopifyProduct.isBoxLot : false);
  const palletItems = items.filter( item => item.shopifyProduct ? item.shopifyProduct.isPallet : false);
  const truckloadItems = items.filter( item => item.shopifyProduct ? item.shopifyProduct.isTruckload : false);

  // Shipping costs in USD
  let total = 0;
  total += boxLotsShipping(boxLotItems);
  total += palletsShipping(palletItems);

  return total*100; // Shopify expects result in cents
}
