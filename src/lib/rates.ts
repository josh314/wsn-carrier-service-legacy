import * as shopify from 'shopify/client';
import { ZoneRateProvider } from 'zone-rates';
import { UpsRateProvider } from 'ups/rate-provider';

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

  constructor(boxRate: number, palletRate: CarrierService.PalletRate | null) {
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

/********************************************************************
 * Initialization of clients & rate-providers
 *
 * *******************/

const shopifyClient: shopify.Client = new shopify.Client({
  store: process.env.SHOPIFY_STORE_NAME!,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
});

const rateProvider: CarrierService.RateProvider = new ZoneRateProvider();
const upsRateProvider: CarrierService.RateProvider = new UpsRateProvider({
  accountNumber: process.env.UPS_ACCOUNT_NUMBER!,
  accessLicenseNumber: process.env.UPS_ACCESS_KEY!,
  user: process.env.UPS_USER!,
  password: process.env.UPS_PASSWORD!,
  development: process.env.NODE_ENV === 'development'
});

/**********************************************
 * Functions
 * 
 * ********************************************/

const attachProductToItem = ( products: Array<Shopify.Product> ) => {
  return (item: CarrierService.OrderItem): CarrierService.DressedOrderItem => {
    const newItem: CarrierService.DressedOrderItem = Object.assign(
      { shopifyProduct: products.find( p => item.variant_id === p.variantId ) as Shopify.Product },
      item
    );
    return newItem;
  };
};

/*********************************************
* Main
* 
*********/
export async function computeRates(opts: CarrierService.ComputeRateOptions): Promise< Array<Rate> > {
  try{
    const productVariantIds: Array<number> = opts.orderItems.map( x => x.variant_id ).filter(x=>x);
    const products: Array<Shopify.Product> = await shopifyClient.getProductData(productVariantIds);

    if(process.env.DEBUG) {
      console.log('\n');
      console.log('Product data:');
      console.log( JSON.stringify(products, null, 2) );
    }

    const items: Array<CarrierService.DressedOrderItem> = opts.orderItems.map(attachProductToItem(products));


    const boxLotItems = items.filter( item => item.shopifyProduct ? item.shopifyProduct.isBoxLot : false);
    const palletItems = items.filter( item => item.shopifyProduct ? item.shopifyProduct.isPallet : false);
    // const truckloadItems = items.filter( item => item.shopifyProduct ? item.shopifyProduct.isTruckload : false);

    const palletRates: Array< CarrierService.PalletRate > = await zoneRateProvider.getPalletRates(palletItems, opts.destination);

    const boxRate: number = await zoneRateProvider.getBoxRate( boxLotItems , opts.destination );

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
