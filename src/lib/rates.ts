import * as shopify from 'shopify/client';
// import { FreeRateProvider } from 'free-rates'; // Not currently in use
import { ZoneRateProvider } from 'zone-rates';
import { TableRateProvider } from 'table-rates';


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

  constructor( rateProviderRates: CarrierService.RateProviderRate[], shippingItems: CarrierService.ShippingItem[] ) {
    this.service_code = 'wholesaleninjas_shipping'; //TODO!
    this.currency = 'USD';

    const unweighedBoxShippingItems = shippingItems.filter( _ => !_.weight && _.packagingType === 'package' );
    let weighedBoxShippingItems = shippingItems.filter( _ => _.weight && _.packagingType === 'package' );
    weighedBoxShippingItems = weighedBoxShippingItems.concat( unweighedBoxShippingItems.map( _ => Object.assign( _, { weight: 40 } ) )  ); // add an estimated weight, but don't bother with linear dims
    const totalBoxWeight = weighedBoxShippingItems.reduce( ( totalBoxWeight, _item ) => totalBoxWeight + _item.weight , 0 );

    const anyFreight = rateProviderRates.some( _rpr => _rpr.options.isFreight );
    const hasPalletBreakdownService = rateProviderRates.filter( isPalletBreakdownServiceRate );

    // determine number of Pallet Breakdown Service boxes
    const numPalletBreakdownServicePallets = hasPalletBreakdownService.reduce( ( _total, _rpr ) => _total + _rpr.numberOfRatedItems, 0 );
    const numPalletBreakdownServiceBoxes = 8*numPalletBreakdownServicePallets;

    if( anyFreight ) {
      this.service_name = 'Freight Shipping';
      this.description = `Your order contains at least one item that requires freight shipping. You will be contacted by the carrier to arrange a delivery window. Other items shipped separately via standard ground.`;
    }
    else if ( hasPalletBreakdownService.length ) {
      this.service_name = 'Standard Ground Shipping with Pallet Breakdown Service';
      this.description = `Approximately ${ weighedBoxShippingItems.length + numPalletBreakdownServiceBoxes } boxes with a total weight of about ${ totalBoxWeight + numPalletBreakdownServiceBoxes*40 } pounds. Includes Tracking.`;
    }
    else {
      this.service_name = 'Standard Ground Shipping';
      this.description = `Rate for ${ weighedBoxShippingItems.length > 1 ? `${weighedBoxShippingItems.length } boxes` : '1 box' } with a ${weighedBoxShippingItems.length > 1 ? 'total ' : '' }weight of approximately ${totalBoxWeight} pounds. Includes tracking.`;
    }

    const cost = rateProviderRates.reduce( ( _total, _rpr ) => _total + _rpr.cost, 0 );
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

// TODO: not currently in use
// const freeRateProvider = new FreeRateProvider();

/**********************************************
 * Functions/Helpers
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

const getOrderItemShippingItems = (rateEachShippingItem: boolean ) => ( orderItem: CarrierService.DressedOrderItem ): Array<CarrierService.ShippingItem> => {

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
    widthUnits: 'inches',
    shopifyProduct: product
  };

  let shippingItems: Array<CarrierService.ShippingItem>;
  if( product.shippingItems && product.shippingItems.length > 0 ) {
    shippingItems = [];

    for(let i=0; i<orderItem.quantity; i++) {

      product.shippingItems.forEach( (productShippingItem, idx) => {

        const newCarrierServiceShippingItem: CarrierService.ShippingItem = Object.assign( {} , baseShippingItem, productShippingItem );

        if( !rateEachShippingItem && idx !== 0 ) {
          newCarrierServiceShippingItem.doNotRate = true;
        }

        shippingItems.push(newCarrierServiceShippingItem);

      });

    }

  }
  else {
    const num = product.numBoxes ? product.numBoxes * orderItem.quantity : orderItem.quantity;

    shippingItems = Array( num ).fill( baseShippingItem );
  }

  return shippingItems;
};

const getAllShippingItems = ( dressedOrderItems: Array<CarrierService.DressedOrderItem>, rateEachShippingItem: boolean = true ): Array<CarrierService.ShippingItem> => {
  const orderItemsShippingItems: Array< Array<CarrierService.ShippingItem> > = dressedOrderItems.map( getOrderItemShippingItems(rateEachShippingItem) );

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

// all non-freight pallets are pallet breakdown service
function isPalletBreakdownServiceRate( rateProviderRate: CarrierService.RateProviderRate ) {

  return rateProviderRate.packagingType === 'pallet' && !rateProviderRate.options.isFreight;

}

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

  const rateTable: shopify.RateTable = await shopifyClient.getRateTable2( productVariantIds );
  const tableRateProvider = new TableRateProvider( rateTable );

  const palletBreakdownServiceRateValue = await shopifyClient.getPalletBreakdownServiceRateValue();
  const zoneRateProvider: CarrierService.RateProvider = new ZoneRateProvider( palletBreakdownServiceRateValue );
  

  const dressedOrderItems: Array<CarrierService.DressedOrderItem> = opts.orderItems.map(attachProductToItem(products));

  const dressedOrderItemHasValidTableRate = ( dressedOrderItem : CarrierService.DressedOrderItem ) : boolean => {

    if( dressedOrderItem.shopifyProduct && dressedOrderItem.shopifyProduct.variantId ) {

      let tableRate = tableRateProvider.getTableRate( dressedOrderItem.shopifyProduct.variantId );
      return typeof tableRate === 'number';
    }
    else {
      return false;
    }
  };
  const tableRateDressedOrderItems = dressedOrderItems.filter( dressedOrderItemHasValidTableRate );
  const nonTableRateDressedOrderItems = dressedOrderItems.filter( _ => !dressedOrderItemHasValidTableRate(_) );

  const palletZoneRateDressedOrderItems = nonTableRateDressedOrderItems.filter( _ => _.shopifyProduct.isPallet );
  const boxLotZoneRateDressedOrderItems = nonTableRateDressedOrderItems.filter( _ => !_.shopifyProduct.isPallet );

  const tableRateShippingItems: Array<CarrierService.ShippingItem> = getAllShippingItems( tableRateDressedOrderItems, false );
  const palletZoneRateShippingItems: Array<CarrierService.ShippingItem> = getAllShippingItems( palletZoneRateDressedOrderItems, false );
  const boxLotZoneRateShippingItems: Array<CarrierService.ShippingItem> = getAllShippingItems( boxLotZoneRateDressedOrderItems );

  if(process.env.DEBUG) {
    console.log('\n');
    console.log('Table Rate Shipping Items:');
    console.log( JSON.stringify(tableRateShippingItems, null, 2) );

    console.log('Box Lot Zone Rate Shipping Items:');
    console.log( JSON.stringify(boxLotZoneRateShippingItems, null, 2) );

    console.log('Pallet Zone Rate Shipping Items:');
    console.log( JSON.stringify(palletZoneRateShippingItems, null, 2) );
  }

  // request all Rates simultaneously
  const [
    tableRates,
    boxLotZoneRates,
    palletZoneRates
  ]: Array<CarrierService.RateProviderRate[]> = await Promise.all([
    tableRateProvider.getBoxRates( tableRateShippingItems, opts.destination ),
    zoneRateProvider.getBoxRates( boxLotZoneRateShippingItems, opts.destination ),
    zoneRateProvider.getPalletRates( palletZoneRateShippingItems, opts.destination )
  ]);

  //sort rates
  tableRates.sort(cmpRateProviderRates);
  boxLotZoneRates.sort(cmpRateProviderRates);
  palletZoneRates.sort(cmpRateProviderRates);

  console.log('Table Rates:');
  console.log( JSON.stringify(tableRates, null, 2) );

  console.log('Box Lot Zone Rates:');
  console.log( JSON.stringify(boxLotZoneRates, null, 2) );

  console.log('Pallet Zone Rates:');
  console.log( JSON.stringify(palletZoneRates, null, 2) );


  const rateProviderRates = ( [] as CarrierService.RateProviderRate[] ).concat(
    tableRates,
    boxLotZoneRates,
    palletZoneRates
  );
  
  const totalShippingItems = ( [] as CarrierService.ShippingItem[] ).concat(
    tableRateShippingItems,
    boxLotZoneRateShippingItems,
    palletZoneRateShippingItems
  );

  return [
    new Rate( rateProviderRates, totalShippingItems )
  ];

}
