/* eslint-disable no-unused-vars */
import * as shopify from 'shopify/client';
/* eslint-enable no-unused-vars */

export interface TableRateProviderRate extends CarrierService.RateProviderRate {
  provider: 'TABLE'
}

/**********************************************************
 * RateProvider
 * 
 **************/

export class TableRateProvider implements CarrierService.RateProvider {

  private table: shopify.RateTable;

  constructor(rateTable: shopify.RateTable) {

    this.table = rateTable;
 
  }

  public getTableRate( productVariantId: shopify.ProductVariantId ): shopify.TableRate | undefined {

    return this.table.get( productVariantId );

  }

  public async getBoxRates( shippingItems: Array<CarrierService.ShippingItem>, _destination: CarrierService.Contact ): Promise< TableRateProviderRate[] > {
    const boxLotRates: TableRateProviderRate[] = [];

    shippingItems.forEach( shippingItem => {

      let tableRateEntry;

      if( shippingItem.shopifyProduct ) {

        tableRateEntry = this.getTableRate( shippingItem.shopifyProduct.variantId );
        
      }

      if( tableRateEntry ) {

        let rate: TableRateProviderRate = {
          provider: 'TABLE',
          cost: 0, // cost is 0 by default
          packagingType: 'package',
          numberOfRatedItems: 1, // TODO?
          options: {
            isFreight: false
          }
        };


        if( !shippingItem.doNotRate ) { // Set cost from table if a rate-able item

          rate.cost = tableRateEntry;

        }

        boxLotRates.push( rate );
      }

    });


    return boxLotRates;

  }

  public async getPalletRates( _palletItems: Array<CarrierService.ShippingItem>, _destination: CarrierService.Contact ): Promise< TableRateProviderRate[] > {
    const palletRates: TableRateProviderRate[] = [];

    return palletRates;
  }
}