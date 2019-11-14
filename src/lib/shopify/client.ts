import * as rp from 'request-promise';
import { Product } from 'shopify/product';

/*********************************************
 * Types
 * 
 * *******************/
interface ClientAuthOpts {
	readonly store: string,
	readonly accessToken: string,
}

/*****************************
 * GraphQl request strings
 * 
 ****************************/
const gqlQueries = {
  getProductData: (productVariantGraphQlIds: Array<string>): string => {
    return `
      {${productVariantGraphQlIds.map((gid,idx)=>`
        _${idx}: productVariant(id: "${gid}") {
          id
          sku
          shippingItems: metafield(namespace:"shipping", key:"shippingItems") {
            value
          }
          numBoxes: metafield(namespace:"shipping", key:"numBoxes") {
            value
          }
          product {
            id
            title
            tags
            totalUnits: metafield(namespace:"lot", key:"totalUnits") {
              value
            }
          }          
        }`).join('')}}
    `;
  },
};

const productVariantId2Gid = (pvid: number | string): string => `${pvid}`.search('gid://shopify/ProductVariant/') < 0 ? `gid://shopify/ProductVariant/${pvid}` : pvid.toString();

function arrayifyGqlMultiData(gqlMultiData: Shopify.GraphQlMultiData): Array<Shopify.GraphQlProductVariant> {
  return Object.entries(gqlMultiData).map( x => x[1] );
}

/*****************************************
 * Client
 * 
 *********************************/

export class Client {
  authOpts: ClientAuthOpts;

  constructor(_clientAuthOpts: ClientAuthOpts) {  
    this.authOpts = _clientAuthOpts;
  }

  async request(opts: Shopify.RequestOpts): Promise<any> {

    const req: rp.Options = {
      method: 'POST',
      uri: `https://${this.authOpts.store}.myshopify.com/admin/api/graphql.json`,
      headers: {
        "Content-Type": "application/graphql",
        "X-Shopify-Access-Token": this.authOpts.accessToken
      },
      body: opts.gqlQuery
    };

    console.log('Requesting product data from Shopify:');
    console.log( JSON.stringify(req, null, 2) );
    const shopifyResp = await rp(req);

    if(process.env.DEBUG) {
      console.log('Shopify Response:');
    }
    let resp: any;
    try {
      resp = JSON.parse(shopifyResp);
      if(process.env.DEBUG) {
        console.log(JSON.stringify(resp, null, 2));
      }
    }
    catch (e) {
      resp = shopifyResp;
      if(process.env.DEBUG) {
        console.log(resp);
      }
    }
    
    return resp;
  }

  async getProductData(productVariantIds: Array<number>): Promise<Array<Product>> {
    try {
      const shopifyResp: Shopify.GraphQlResponse = await this.request({ 
        gqlQuery: gqlQueries.getProductData(productVariantIds.map(productVariantId2Gid)),
      });
    
      const gqlProductVariants: Array<Shopify.GraphQlProductVariant> = arrayifyGqlMultiData(shopifyResp.data);
      const products: Array<Product> = gqlProductVariants.filter( _ => _ /* filter out null */ ).map( _ => new Product(_) );
      return products;
    }
    catch(e) {
      console.log(e);
      throw new Error(e);
    }
  }
}
