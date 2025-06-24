// operaciones.js
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI || 'mongodb+srv://ErmJJ:j2oZ8N3jC86Lzxdf@nexus.awllosy.mongodb.net/';
const client = new MongoClient(uri);

async function main() {
  await client.connect();
  const db = client.db('tienda_ropa');
  
  // aquí van las operaciones
}

main()
  .catch(console.error)
  .finally(() => client.close());
