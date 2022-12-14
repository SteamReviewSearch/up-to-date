const { Client } = require("@elastic/elasticsearch");
require("dotenv").config();
const env = process.env;

const client = new Client({
  cloud: {
    id: env.CLOUD_ID,
  },
  auth: {
    username: env.JJ,
    password: env.JJPW,
  },
});

// client.info()
//   .then(response => console.log(`Elasticsearch success - version ${response.version.number}`))
//   .catch(error => console.error(error))

module.exports = client;
