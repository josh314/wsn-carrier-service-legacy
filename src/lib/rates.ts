import * as shopify from 'shopify/client';
import * as zoneRates from 'zone-rates';

/*********************************************
 * Types
 * 
 * *******************/

class Rate implements CarrierService.Rate {
  public readonly service_name: string;
  public readonly description: string;
  public readonly service_code: string;
  public readonly currency: string;
  public readonly total_price: string;
  public readonly phone_required?: boolean;
  public readonly min_delivery_date?: string;
  public readonly max_delivery_date?: string;

  constructor(boxRate: number, palletRate: PalletRate | null) {
    this.service_code = 'wholesaleninjas_shipping'; //TODO!
    this.currency = 'USD';

    let cost: number;

    if(!palletRate) {
      this.service_name = 'Standard Ground Shipping';
      this.description = 'Includes tracking.';
      cost = boxRate;
    }
    else if ( !palletRate.isFreight ) {
      this.service_name = 'Standard Ground Shipping with Pallet Breakdown Service';
      this.description = 'Pallets are broken down into boxes and shipped via standard ground shipping. Includes tracking.';
      cost = boxRate + palletRate.cost;
    }
    else {
      this.service_name = 'Freight Shipping';
      this.description = 'Pallets will be shipped via freight & other items shipped separately via ground.';
      cost = boxRate + palletRate.cost;
    }

    this.total_price = (100*cost).toString();
  }
}

interface PalletRate {
  cost: number,
  isFreight: boolean
}

/********************************************************************
 * Initialization
 *
 * *******************/

const shopifyClient: shopify.Client = new shopify.Client({
  store: process.env.SHOPIFY_STORE_NAME!,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
});

/**********************************************
 * Functions
 * 
 * ********************************************/

const getTotalShippingItems = (items: Array<CarrierService.DressedOrderItem>): number => {
  return items.reduce( (total, item): number => {
    if( item.shopifyProduct.shippingItems && item.shopifyProduct.shippingItems.length > 0 ) {
      return total + item.shopifyProduct.shippingItems.length * item.quantity;
    }
    else if( item.shopifyProduct.numBoxes ) {
      return total + item.shopifyProduct.numBoxes * item.quantity;
    }
    else {
      return total + item.quantity;
    }
  }, 0);
};

const attachProductToItem = ( products: Array<Shopify.Product> ) => {
  return (item: CarrierService.OrderItem): CarrierService.DressedOrderItem => {
    const newItem: CarrierService.DressedOrderItem = Object.assign(
      { shopifyProduct: products.find( p => item.variant_id === p.variantId ) as Shopify.Product },
      item
    );
    return newItem;
  };
};

const getPalletRates = function(items: Array<CarrierService.DressedOrderItem>, destination: CarrierService.Contact): Array<PalletRate> {
  const palletRates: Array<PalletRate> = [];

  if(items.length > 0) {

    if(items.every( i => !i.shopifyProduct.shipsByFreight() )) {
      palletRates.push({
        cost: zoneRates.getPalletBreakdownRate( destination.province , getTotalShippingItems( items ) ),
        isFreight: false
      });
    }

    palletRates.push({
      cost: zoneRates.getPalletFreightRate( destination.province , getTotalShippingItems( items ) ),
      isFreight: true
    });

  }

  return palletRates;
};

/*********************************************
* Main
* 
*********/
export async function computeRates(opts: CarrierService.ComputeRateOptions): Promise< Array<Rate> > {
  try{
    const productVariantIds: Array<number> = opts.items.map( x => x.variant_id ).filter(x=>x);
    const products: Array<Shopify.Product> = await shopifyClient.getProductData(productVariantIds);

    if(process.env.DEBUG) {
      console.log('\n');
      console.log('Product data:');
      console.log( JSON.stringify(products, null, 2) );
    }

    const items: Array<CarrierService.DressedOrderItem> = opts.items.map(attachProductToItem(products));


    const boxLotItems = items.filter( item => item.shopifyProduct ? item.shopifyProduct.isBoxLot : false);
    const palletItems = items.filter( item => item.shopifyProduct ? item.shopifyProduct.isPallet : false);
    // const truckloadItems = items.filter( item => item.shopifyProduct ? item.shopifyProduct.isTruckload : false);

    const palletRates: Array<PalletRate> = getPalletRates(palletItems, opts.destination);

    const boxRate = zoneRates.getBoxRate( opts.destination.province , getTotalShippingItems( boxLotItems ) );

    let rates: Array<Rate>;

    if( palletRates.length > 0 ) {
      rates = palletRates.map( pr => new Rate(boxRate, pr) );
    }
    else {
      rates = [ new Rate(boxRate, null) ];
    }

    return rates;
  }
  catch(e) {
    console.log(e);
    throw new Error(e);
  }
}
