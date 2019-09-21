const rp = require('request-promise');

const gqlQueries = {
  getProductData: (pids) => {
    return `
      {${pids.map((gid,idx)=>`
        _${idx}: productVariants(id: "${gid}") {
          id
          title
          tags
        }`).join('')}}
    `;
  },
};

const productVariantId2Gid = (pvid) => `${pvid}`.search('gid://shopify/ProductVariant/') < 0 ? `gid://shopify/ProductVariant/${pvid}` : pvid;

function Client(clientOpts) {

  // Private vars
  const { store, accessToken } = clientOpts;
  if(!store || !accessToken) {
    throw new Error('Must initialize Shopify client with both `store` and `accessToken` parameters.');
  }

  async function gqlRequest(opts={}) {
    if(opts.debug) {
      console.log(opts.query);
    }

    const req = {
      method: 'POST',
      url: `https://${store}.myshopify.com/admin/api/graphql.json`,
      headers: {
        "Content-Type": "application/graphql",
        "X-Shopify-Access-Token": accessToken
      },
      body: opts.query
    };
    const resp = await rp(req);
    try {
      return JSON.parse(resp);
    }
    catch (e) {
      return resp;
    }
  }
  exports.request = gqlRequest;

  this.getProductData = function(productVariantIds) {
    return gqlRequest({ query: gqlQueries.getProducts(productVariantIds.map(productVariantId2Gid)) });
  };
}

module.exports = Client;
