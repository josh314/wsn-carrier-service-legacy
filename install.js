
const settings = require('./settings');

const die = (msg) => {
  console.log(msg);
  process.exit(1);
};


const args = require('minimist')(process.argv.slice(2), { 
  alias: {
    'command': ['c', 'cmd'],
    'store': ['s'],
    'deploy': [ 'd' ],
    'callbackUrl': [ 'cb', 'cb_url', 'cbUrl', 'callback', 'callback_url' ]
  }
});

const store = args.store ? args.store : 'ninjasAndSuch';
const command = args.command ? args.command : 'list';
const shopifyConfig = settings.shopify[store];

const Shopify = require('shopify-api-node');
const shopify = new Shopify({
  shopName: shopifyConfig.url,
  apiKey: shopifyConfig.auth.apiKey,
  password: shopifyConfig.auth.password,
});


const deploys = {
  "local": "https://josh-wsn.ngrok.io/.netlify/functions/get-rate",
  "dev": "https://development--determined-fermi-a96772.netlify.com/.netlify/functions/get-rate",
  "staging": "https://staging--determined-fermi-a96772.netlify.com/.netlify/functions/get-rate",
  "prod": "https://shipping-rates.wholesaleninjas.com/.netlify/functions/get-rate",
  "promotion": "https://promo-2021-09-free-cosmetics-shipping--determined-fermi-a96772.netlify.app/.netlify/functions/get-rate"
};

let cmd;

if(command==='list') {
  cmd = shopify.carrierService.list()
}
else if (command==='create') {

  const carrierServiceSettings = {
    "name": "wsn_carrier_service",
    "callback_url": args.callbackUrl || deploys[args.deploy || "local"],
    "service_discovery": true
  }

  cmd = shopify.carrierService.create(carrierServiceSettings);
}
else if (command==='delete' && args.id) {
  const id = args.id;
  cmd = shopify.carrierService.delete(id);
}

if(cmd) {
  cmd
    .then(console.log)
    .catch(console.error);
}