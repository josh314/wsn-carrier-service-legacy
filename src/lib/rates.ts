import * as shopify from 'shopify/client';
import { ZoneRateProvider } from 'zone-rates';
import { UpsRateProvider } from 'ups/rate-provider';

const CANONICAL_DESTINATION: CarrierService.Contact = {
  address1: '4604 FESSENEVA CT',
  city: 'Naperville',
  province: 'IL',
  postal_code: '60564-5835',
  country: 'US'
};


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

  constructor(boxRate: number, palletRate: CarrierService.RateProviderRate | null, boxRateShippingItems: CarrierService.ShippingItem[], palletRateShippingItems: CarrierService.ShippingItem[]) {
    this.service_code = 'wholesaleninjas_shipping'; //TODO!
    this.currency = 'USD';

    console.log('boxRateShippingItems:');
    console.log(boxRateShippingItems);

    const unweighedShippingItems = boxRateShippingItems.filter( _ => !_.weight );
    let weighedShippingItems = boxRateShippingItems.filter( _ => _.weight );
    console.log('unweighedShippingItems:');
    console.log(unweighedShippingItems);
    weighedShippingItems = weighedShippingItems.concat( unweighedShippingItems.map( _ => Object.assign( _, { weight: 40 } ) )  );
    console.log('weighedShippingItems:');
    console.log(weighedShippingItems);
    const totalBoxWeight = weighedShippingItems.reduce( (totalWeight, box ) => totalWeight + box.weight , 0 );


    let cost: number;
    if(!palletRate) {
      this.service_name = 'Standard Ground Shipping';
      this.description = `Rate for ${ weighedShippingItems.length > 1 ? `${weighedShippingItems.length } boxes` : '1 box' } with a ${weighedShippingItems.length > 1 ? 'total ' : '' }weight of approximately ${totalBoxWeight} pounds. Includes tracking.`;
      cost = boxRate;
    }
    else if ( !palletRate.options.isFreight ) {
      this.service_name = 'Standard Ground Shipping with Pallet Breakdown Service';
      this.description = `Between ${ weighedShippingItems.length + 6*palletRateShippingItems.length }-${ weighedShippingItems.length + 8*palletRateShippingItems.length } boxes with a total weight of about ${totalBoxWeight + 400*palletRateShippingItems.length} pounds. Includes Tracking.`;
      cost = boxRate + palletRate.cost;
    }
    else {
      this.service_name = 'Freight Shipping';
      this.description = `Your ${palletRateShippingItems.length > 1 ? `${palletRateShippingItems.length} pallets`: 'pallet'} will be shipped via freight & other items shipped separately via ground.`;
      cost = boxRate + palletRate.cost;
    }

    // Convert to cents, round up to nearest cent, and cast as string
    this.total_price = ( Math.ceil( 100*cost ) ).toString();
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

const zoneRateProvider: CarrierService.RateProvider = new ZoneRateProvider();
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

const getOrderItemShippingItems = ( orderItem: CarrierService.DressedOrderItem ): Array<CarrierService.ShippingItem> => {

  const product: Shopify.Product = orderItem.shopifyProduct;
  if(!product) {
    throw new Error(`No product found for orderItem: ${JSON.stringify( orderItem )}`);
  }

  const baseShippingItem: CarrierService.ShippingItem = { 
    packagingType: product.isTruckload ? 'truckload' : ( product.isPallet ? 'pallet' : 'package' ),
    shipsByFreight: product.shipsByFreight(),
    weight: 0,
    weightUnits: 'pounds',
    height: 0,
    heightUnits: 'inches',
    length: 0,
    lengthUnits: 'inches',
    width: 0,
    widthUnits: 'inches'
  };

  let shippingItems: Array<CarrierService.ShippingItem>;
  if( product.shippingItems && product.shippingItems.length > 0 ) {
    shippingItems = [];
    product.shippingItems.forEach( productShippingItem => {
      for(let i=0; i<orderItem.quantity; i++) {
        const newCarrierServiceShippingItem: CarrierService.ShippingItem = Object.assign( {} , baseShippingItem, productShippingItem );        
        shippingItems.push(newCarrierServiceShippingItem);
      }
    });
  }
  else {
    const num = product.numBoxes ? product.numBoxes * orderItem.quantity : orderItem.quantity;

    shippingItems = Array( num ).fill( baseShippingItem );
  }

  return shippingItems;
};

const getAllShippingItems = ( dressedOrderItems: Array<CarrierService.DressedOrderItem> ): Array<CarrierService.ShippingItem> => {
  const orderItemsShippingItems: Array< Array<CarrierService.ShippingItem> > = dressedOrderItems.map(getOrderItemShippingItems);

  return orderItemsShippingItems.reduce( ( allShippingItems: Array<CarrierService.ShippingItem> , singleOrderShippingItems: Array<CarrierService.ShippingItem>): Array<CarrierService.ShippingItem> => {
    return allShippingItems.concat(singleOrderShippingItems);
  }, []);
};

const cmpRateProviderRates = ( a: CarrierService.RateProviderRate, b: CarrierService.RateProviderRate ): number => {
  if( a.cost < b.cost) {
    return - 1;
  }
  else if ( a.cost > b.cost ) {
    return 1;
  }
  else {
    return 0;
  }
};

/*********************************************
* Main
* 
*********/
export async function computeRates(opts: CarrierService.ComputeRateOptions): Promise< Array<Rate> > {
  const productVariantIds: Array<number> = opts.orderItems.map( x => x.variant_id ).filter(x=>x);
  const products: Array<Shopify.Product> = await shopifyClient.getProductData(productVariantIds);

  if(process.env.DEBUG) {
    console.log('\n');
    console.log('Product data:');
    console.log( JSON.stringify(products, null, 2) );
  }

  const dressedOrderItems: Array<CarrierService.DressedOrderItem> = opts.orderItems.map(attachProductToItem(products));
  const shippingItems: Array<CarrierService.ShippingItem> = getAllShippingItems(dressedOrderItems);

  const palletShippingItems: Array<CarrierService.ShippingItem> = [];
  const zoneRateShippingItems: Array<CarrierService.ShippingItem> = [];
  const upsShippingItems: Array<CarrierService.ShippingItem> = [];

  shippingItems.forEach( item => {
    if ( item.packagingType === 'pallet' ) {
      palletShippingItems.push( item );
    }
    else if ( !item.weight ) {
      zoneRateShippingItems.push( item );
    }
    else {
      upsShippingItems.push( item );
    }
  });

  if(process.env.DEBUG) {
    console.log('\n');
    console.log('Shipping Items:');
    console.log( JSON.stringify(shippingItems, null, 2) );

    console.log('Zone Rate Shipping Items:');
    console.log( JSON.stringify(zoneRateShippingItems, null, 2) );

    console.log('Pallet Shipping Items:');
    console.log( JSON.stringify(palletShippingItems, null, 2) );

    console.log('UPS Shipping Items:');
    console.log( JSON.stringify(upsShippingItems, null, 2) );
  }

  // request all Rates simultaneously
  const [
    boxLotZoneRates,
    palletRates,
    boxLotUpsRates
  ]: Array<CarrierService.RateProviderRate[]> = await Promise.all([
    zoneRateProvider.getBoxRates( zoneRateShippingItems, opts.destination ),
    zoneRateProvider.getPalletRates( palletShippingItems, opts.destination),
    upsRateProvider.getBoxRates( upsShippingItems, CANONICAL_DESTINATION )
  ]);

  //sort rates
  boxLotZoneRates.sort(cmpRateProviderRates);
  palletRates.sort(cmpRateProviderRates);
  boxLotUpsRates.sort(cmpRateProviderRates);

  console.log('Box Lot Zone Rates:');
  console.log( JSON.stringify(boxLotZoneRates, null, 2) );

  console.log('Pallet Rates:');
  console.log( JSON.stringify(palletRates, null, 2) );

  console.log('Box Lot UPS rates:');
  console.log( JSON.stringify(boxLotUpsRates, null, 2) );

  const totalBoxRate: number = [ boxLotZoneRates[0], boxLotUpsRates[0] ].filter( _ => _ ).reduce( (total, rate) => total + rate.cost, 0);

  let rates: Array<Rate>;

  if( palletRates.length > 0 ) {
    rates = palletRates.map( pr => new Rate(totalBoxRate, pr, zoneRateShippingItems.concat(upsShippingItems), palletShippingItems) );
  }
  else {
    rates = [ new Rate(totalBoxRate, null, zoneRateShippingItems.concat(upsShippingItems), palletShippingItems) ];
  }

  return rates;

}
