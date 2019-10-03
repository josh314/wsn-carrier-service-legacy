import * as rp from 'request-promise';

/*********************************************
 * Types
 * 
 * *******************/
interface ClientAuthOpts {
	readonly store: string,
	readonly accessToken: string,
}

interface ShopifyRequestOpts {
  // debug?: boolean,
  gqlQuery: string
}

export interface Product {
  productId: number,
  variantId: number,
  totalUnits?: number,
  tags: Array<string>
}

interface GraphQlResponse {
  data: GraphQlResponseData,
  extensions: {
    cost: GraphQlCost
  }
}

interface GraphQlCost {
  requestedQueryCost: number,
  actualQueryCost: number,
  throttleStatus: GraphQlThrottleStatus
}

interface GraphQlThrottleStatus {
  maximumAvailable: number,
  currentlyAvailable: number,
  restoreRate: number
}
type GraphQlResponseData = GraphQlData | GraphQlMultiData;

type GraphQlData = object;

type GraphQlMultiData = object;

interface MetafieldNode {
  id: string,
  key: string,
  value: string | number
}

interface GraphQlProduct {
  id: string,
  title: string,
  tags: Array<string>,
  metafields?: {
    edges: Array<MetafieldNode>
  }
  totalUnits?: null | {
    value: string | number
  }
}

interface GraphQlProductVariant {
  id: string,
  title: string,
  product: GraphQlProduct
}

// {
//   "data": {
//     "_0": {
//       "id": string,
//       "title": string,
//       "product": {
//         "id": string,
//         "title": string,
//         "tags": Array<string>,
//         "metafields": {
//           "edges": Array<MetafieldNode>
//         }
//       }
//     }
//   },
//   "extensions": {
//       ...blahblah
//   }
// }

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
          title
          product {
            id
            title
            tags
            totalUnits: metafield(namespace:lot, key:totalUnits) {
              value
            }
          }          
        }`).join('')}}
    `;
  },
};

const productVariantId2Gid = (pvid: number | string): string => `${pvid}`.search('gid://shopify/ProductVariant/') < 0 ? `gid://shopify/ProductVariant/${pvid}` : pvid.toString();
const gid2ShopifyRestId = (gid: string): number | null => {
  const match = gid.match(/gid:\/\/shopify\/[a-zA-Z]+\/([0-9]+)/);
  return match ? parseInt(match[1]) : null;
};

function arrayifyGqlMultiData(gqlMultiData: GraphQlMultiData): Array<GraphQlProductVariant> {
  return Object.entries(gqlMultiData).map( x => x[1] );
}

function gqlProductVariant2Product(gqlProductVariant: GraphQlProductVariant) : Product {
  let product: Product = {
    variantId: gid2ShopifyRestId(gqlProductVariant.id),
    productId: gid2ShopifyRestId(gqlProductVariant.product.id),
    tags: gqlProductVariant.product.tags,
  };
  if(gqlProductVariant.product.totalUnits) {
    product.totalUnits = parseInt(gqlProductVariant.product.totalUnits.value as string);
  }
  return product;
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

  async request(opts: ShopifyRequestOpts): Promise<any> {
    if(process.env.DEBUG) {
      console.log('Query:');
      console.log(opts.gqlQuery);
    }

    const req: rp.Options = {
      method: 'POST',
      uri: `https://${this.authOpts.store}.myshopify.com/admin/api/graphql.json`,
      headers: {
        "Content-Type": "application/graphql",
        "X-Shopify-Access-Token": this.authOpts.accessToken
      },
      body: opts.gqlQuery
    };
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
      const shopifyResp: GraphQlResponse = await this.request({ 
        gqlQuery: gqlQueries.getProductData(productVariantIds.map(productVariantId2Gid)),
      });
    
      const gqlProductVariants: Array<GraphQlProductVariant> = arrayifyGqlMultiData(shopifyResp.data);
      const products: Array<Product> = gqlProductVariants.map(gqlProductVariant2Product);
      return products;
    }
    catch(e) {
      throw new Error('Failure retrieving product data from Shopify servers.');
    }
  }
}