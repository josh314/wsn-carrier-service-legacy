import * as rp from 'request-promise';

/*********************************************
 * Types
 * 
 * *******************/
interface ClientAuthOpts {
	readonly store: string,
	readonly accessToken: string,
}

interface ShippingItem {
  weight: number,
  weightUnits: string,
  height: number,
  heightUnits: string,
  length: number,
  lengthUnits: string,
  width: number,
  widthUnits: string,
}

// Represents all the relevant info from the Shopify product variant and it's parent product
export class Product {
  // identifiers
  public readonly productId: number;
  public readonly variantId: number;
  public readonly sku: string;

  // metadata
  public readonly totalUnits?: number;
  public readonly numBoxes?: number;
  public readonly shippingItems?: Array<ShippingItem>;
  public readonly tags: Array<string>;

  // Lot type
  public readonly isBoxLot: boolean;
  public readonly isPallet: boolean;
  public readonly isTruckload: boolean;
  
  public constructor(gqlProductVariant: GraphQlProductVariant) {
    this.variantId = gid2ShopifyRestId(gqlProductVariant.id);
    this.productId = gid2ShopifyRestId(gqlProductVariant.product.id);
    this.sku = gqlProductVariant.sku;


    try {
      this.totalUnits = parseInt(gqlProductVariant.product.totalUnits!.value as string);
    }
    catch(e) {
      console.log(`No totalUnits for product variant ${this.variantId}.`);
    }

    try {
      this.numBoxes = parseInt(gqlProductVariant.product.numBoxes!.value as string);
    }
    catch(e) {
      console.log(`No numBoxes for product variant ${this.variantId}.`);
    }

    try {
      this.shippingItems = JSON.parse(gqlProductVariant.product.shippingItems!.value);
    }
    catch(e) {
      console.log(`No valid shippingItems JSON for product variant ${this.variantId}.`);
    }


    this.tags = gqlProductVariant.product.tags.map( t => t.toLowerCase());
    if(gqlProductVariant.product.totalUnits) {
      this.totalUnits = parseInt(gqlProductVariant.product.totalUnits.value as string);
    }

    // Use a lenient version of canonical tags below since some of these may be created by hand.
    this.isBoxLot = this.tags.some( t => t.match(/box lots?/i) );
    this.isTruckload = this.tags.some( t => t.match(/truckloads?/i) );
    this.isPallet = this.tags.some( t => t.match(/pallets?/i) );
  }
  
  public shipsByFreight(): boolean {
    if( this.isTruckload ) {
      return true;
    }
    else if ( this.isPallet ) {
      return this.tags.some( (t: string): boolean => !!t.match(/pallets?:(oversized|bulky)/i) );
    }
    else {
      return false;
    }
  }

}

interface ShopifyRequestOpts {
  // debug?: boolean,
  gqlQuery: string
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
  numBoxes?: null | {
    value: string | number
  }
  shippingItems?: null | {
    value: string
  }
}

interface GraphQlProductVariant {
  id: string,
  sku: string,
  product: GraphQlProduct
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
          product {
            id
            title
            tags
            totalUnits: metafield(namespace:"lot", key:"totalUnits") {
              value
            }
            numBoxes: metafield(namespace:"shipping", key:"numBoxes") {
              value
            }
            shippingItems: metafield(namespace:"shipping", key:"shippingItems") {
              value
            }
          }          
        }`).join('')}}
    `;
  },
};

const productVariantId2Gid = (pvid: number | string): string => `${pvid}`.search('gid://shopify/ProductVariant/') < 0 ? `gid://shopify/ProductVariant/${pvid}` : pvid.toString();
const gid2ShopifyRestId = (gid: string): number => {
  const match = gid.match(/gid:\/\/shopify\/[a-zA-Z]+\/([0-9]+)/);
  if(match) {
    return parseInt(match[1]);
  }
  else {
    throw new Error(`Valid Shopify REST id cannot be created from GraphQl Id ${gid}.`);
  }
};

function arrayifyGqlMultiData(gqlMultiData: GraphQlMultiData): Array<GraphQlProductVariant> {
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
      const products: Array<Product> = gqlProductVariants.filter( _ => _ /* filter out null */ ).map( _ => new Product(_) );
      return products;
    }
    catch(e) {
      console.log(e);
      throw new Error(e);
    }
  }
}