import { Location, OrderItem, DressedOrderItem } from 'rate-request';
import * as shopify from 'shopify';
import * as zoneRates from 'zone-rates';

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

const attachProductToItem = ( products: Array<shopify.Product> ) => {
  return (item: OrderItem): DressedOrderItem => {
    const newItem: DressedOrderItem = Object.assign({}, item);
    newItem.shopifyProduct = products.find( p => item.variant_id === p.variantId );
    return newItem;
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
  try{
    const productVariantIds: Array<number> = opts.items.map( x => x.variant_id ).filter(x=>x);
    const products: Array<shopify.Product> = await shopifyClient.getProductData(productVariantIds);

    if(process.env.DEBUG) {
      console.log('n');
      console.log('Product data:');
      console.log(products);
    }

    // items.forEach(attachProductToItem(products));
    const items: Array<DressedOrderItem> = opts.items.map(attachProductToItem(products));


    const boxLotItems = items.filter( item => item.shopifyProduct ? item.shopifyProduct.isBoxLot : false);

    const palletItems = items.filter( item => item.shopifyProduct ? item.shopifyProduct.isPallet : false);
    const palletBreakdownItems = palletItems.filter( item => item.shopifyProduct.qualifiesForPalletBreakdownService() );
    const palletFreightItems = palletItems.filter( item => !item.shopifyProduct.qualifiesForPalletBreakdownService() );
    // const truckloadItems = items.filter( item => item.shopifyProduct ? item.shopifyProduct.isTruckload : false);

    // Shipping costs in USD
    let totalShippingCosts = 0;
    totalShippingCosts += zoneRates.getBoxRate( opts.destination.province , boxLotItems.reduce( (total, item): number => total + item.quantity , 0 ));
    totalShippingCosts += zoneRates.getPalletBreakdownRate( opts.destination.province , palletBreakdownItems.reduce( (total, item): number => total + item.quantity , 0 ) );
    totalShippingCosts += zoneRates.getPalletFreightRate( opts.destination.province , palletFreightItems.reduce( (total, item): number => total + item.quantity , 0 ) );

    return totalShippingCosts*100; // Shopify expects result in cents
  }
  catch(e) {
    console.log(e);
    throw new Error(e);
  }
}
