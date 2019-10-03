
const settings = require('./settings');

const die = (msg) => {
  console.log(msg);
  process.exit(1);
};

const args = require('minimist')(process.argv.slice(2), { alias: { 'command': ['c', 'cmd'], 'store': ['s'] } });

const store = args.store ? args.store : 'ninjasAndSuch';
const command = args.command ? args.command : 'list';
const shopifyConfig = settings.shopify[store];

const Shopify = require('shopify-api-node');
const shopify = new Shopify({
  shopName: shopifyConfig.url,
  apiKey: shopifyConfig.auth.apiKey,
  password: shopifyConfig.auth.password,
});

let cmd;

if(command==='list') {
  cmd = shopify.carrierService.list()
}
else if (command==='create') {
  cmd = shopify.carrierService.create({
    "name": "Wholesale Ninjas Shipping Service (ngrok)",
    // "callback_url": "https://5d89238ad38da200077fce00--determined-fermi-a96772.netlify.com/.netlify/functions/get-rate",
    "callback_url":"https://josh-wsn.ngrok.io/.netlify/functions/get-rate",
    "service_discovery": true
  });
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