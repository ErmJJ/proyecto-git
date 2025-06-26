// database/operations.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function main() {
  console.log('\n➡️ Conectando a la base de datos...');
  await client.connect();
  const db = client.db('clothing-store-db');
  const brands = db.collection('brands');
  const clothing = db.collection('clothing');
  const users = db.collection('users');
  const sales = db.collection('sales');

  try {
    console.log('\n--- INSERTAR / ACTUALIZAR (UPSERT) ---');

    await brands.bulkWrite([
      { updateOne: { filter: { _id:'brand004' }, update: { $set: { name:'TrendSet', country:'Spain', founded:2020 } }, upsert:true } },
      { updateOne: { filter: { _id:'brand002' }, update: { $set: { name:'EcoStyle CR', founded:2016 } }, upsert:true } }
    ]);
    console.log('✔️ Marcas insertadas/actualizadas.');

    await clothing.bulkWrite([
      { updateOne: { filter: { _id:'cloth004' }, update: { $set: { name:'Winter Scarf', category:'Accessories', price:29.99, size:['One Size'], color:'Red', brand_id:'brand004', in_stock:75 } }, upsert:true } }
    ]);
    console.log('✔️ Ropa nueva agregada mediante upsert.');

    await users.bulkWrite([
      { updateOne: { filter: { _id:'user004' }, update: { $set: { name:'Laura Gómez', email:'laura.gomez@example.com', password:'hashedpassword4', address:{city:'Heredia',country:'Costa Rica'}, orders:[] } }, upsert:true } }
    ]);
    console.log('✔️ Usuario nuevo agregado.');

    console.log('\n--- ELIMINAR DATOS ---');
    const delResult = await brands.deleteOne({ _id:'brand001' });
    console.log(delResult.deletedCount
      ? `🗑️ Marca brand001 eliminada.`
      : `⚠️ Marca brand001 no encontrada para eliminar.`);

    console.log('\n--- INSERTAR NUEVAS VENTAS ---');
    try {
      await sales.insertMany([
        { _id:'sale005', user_id:'user004', clothing_id:'cloth004', quantity:2, date:new Date('2025-06-18') }
      ], { ordered:false });
      console.log('✔️ Venta sale005 registrada.');
    } catch (e) {
      if (e.code === 11000) console.warn('⚠️ La venta sale005 ya existía.');
      else throw e;
    }

    console.log('\n--- ACTUALIZAR STOCK CON $inc ---');
    const soldQty = 2;
    await clothing.updateOne(
      { _id:'cloth004' },
      { $inc: { in_stock: -soldQty } }
    );
    console.log(`✔️ Stock de cloth004 reducido en ${soldQty} unidades.`);

    console.log('\n--- CONSULTAS FORMATEADAS ---');

    // 1) Ventas por fecha
    await showSalesByDate(sales, '2025-06-15');

    // 2) Marcas con ventas
    await showBrandsWithSales(sales, clothing, brands);

    // 3) Prendas vendidas y stock restante
    await showClothingStock(sales, clothing);

    // 4) Top 5 marcas por ventas
    await showTopBrands(sales, clothing, brands);

  } catch (error) {
    console.error('\n❌ Error en operaciones:', error);
  } finally {
    await client.close();
    console.log('\n🔒 Conexión cerrada.');
  }
}

async function showSalesByDate(sales, dateStr) {
  const date = new Date(dateStr);
  const results = await sales.aggregate([
    { $match: { date } },
    { $group: { _id:'$date', totalSold:{ $sum:'$quantity' } } }
  ]).toArray();
  console.log(`\n📅 Ventas del ${dateStr}:`);
  results.forEach(r => console.log(`   • ${r.totalSold} unidades vendidas`));
}

async function showBrandsWithSales(sales, clothing, brands) {
  const clothingIds = await sales.distinct('clothing_id');
  const clothes = await clothing.find({ _id: { $in: clothingIds } }).toArray();
  const brandIds = [...new Set(clothes.map(c => c.brand_id))];
  const brandDocs = await brands.find({ _id: { $in: brandIds } }).toArray();
  
  console.log('\n🏷️ Marcas con al menos una venta:');
  brandDocs.forEach(b => console.log(`   • ${b._id}: ${b.name} (${b.country})`));
}

async function showClothingStock(sales, clothing) {
  const sold = await sales.aggregate([
    { $group: { _id:'$clothing_id', totalSold:{ $sum:'$quantity' } } }
  ]).toArray();

  console.log('\n👕 Stock y ventas por prenda:');
  for (const { _id, totalSold } of sold) {
    const item = await clothing.findOne({ _id });
    const remaining = item.in_stock;
    console.log(`   • ${item.name}: vendidas=${totalSold}, stock=${remaining}`);
  }
}

async function showTopBrands(sales, clothing, brands) {
  const top = await sales.aggregate([
    { $lookup: { from:'clothing', localField:'clothing_id', foreignField:'_id', as:'c' } },
    { $unwind:'$c' },
    { $group: { _id:'$c.brand_id', totalSales:{ $sum:'$quantity' } } },
    { $sort:{ totalSales:-1 } }, { $limit:5 },
    { $lookup: { from:'brands', localField:'_id', foreignField:'_id', as:'b' } },
    { $unwind:'$b' },
    { $project:{ _id:0, brand:'$b.name', totalSales:1 } }
  ]).toArray();

  console.log('\n🥇 Top 5 marcas más vendidas:');
  top.forEach((b,i) => console.log(`   ${i+1}. ${b.brand}: ${b.totalSales} ventas`));
}

main();