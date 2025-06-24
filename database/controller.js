// database/operations.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function main() {
  try {
    await client.connect();
    const db = client.db('clothing-store-db');

    const brands = db.collection('brands');
    const clothing = db.collection('clothing');
    const users = db.collection('users');
    const sales = db.collection('sales'); // Nueva colección para ventas

    // --- INSERTAR DATOS ---

    // Insertar un dato en brands
    await brands.insertOne({
      _id: "brand001",
      name: "UrbanWear",
      country: "USA",
      founded: 2010
    });

    // Insertar varios datos en brands
    await brands.insertMany([
      { _id: "brand002", name: "EcoStyle", country: "Costa Rica", founded: 2015 },
      { _id: "brand003", name: "FashionCo", country: "Mexico", founded: 2005 }
    ]);

    // Insertar un dato en clothing
    await clothing.insertOne({
      _id: "cloth001",
      name: "Slim Fit Jeans",
      category: "Pants",
      price: 49.99,
      size: ["S", "M", "L", "XL"],
      color: "Blue",
      brand_id: "brand001",
      in_stock: 120
    });

    // Insertar varios datos en clothing
    await clothing.insertMany([
      {
        _id: "cloth002",
        name: "Organic Cotton T-Shirt",
        category: "Tops",
        price: 19.99,
        size: ["S", "M", "L"],
        color: "Green",
        brand_id: "brand002",
        in_stock: 200
      },
      {
        _id: "cloth003",
        name: "Leather Jacket",
        category: "Outerwear",
        price: 129.99,
        size: ["M", "L", "XL"],
        color: "Black",
        brand_id: "brand003",
        in_stock: 50
      }
    ]);

    // Insertar un dato en users
    await users.insertOne({
      _id: "user001",
      name: "Gabriel Mata",
      email: "gabriel.mata@example.com",
      password: "hashedpassword1",
      address: { city: "Paraíso", country: "Costa Rica" },
      orders: ["cloth002", "cloth003"]
    });

    // Insertar varios datos en users
    await users.insertMany([
      {
        _id: "user002",
        name: "Ana Lopez",
        email: "ana.lopez@example.com",
        password: "hashedpassword2",
        address: { city: "San José", country: "Costa Rica" },
        orders: ["cloth001"]
      },
      {
        _id: "user003",
        name: "Carlos Ruiz",
        email: "carlos.ruiz@example.com",
        password: "hashedpassword3",
        address: { city: "Alajuela", country: "Costa Rica" },
        orders: []
      }
    ]);

    // Insertar ventas (sales)
    await sales.insertMany([
      {
        _id: "sale001",
        user_id: "user001",
        clothing_id: "cloth002",
        quantity: 3,
        date: new Date("2025-06-15")
      },
      {
        _id: "sale002",
        user_id: "user002",
        clothing_id: "cloth001",
        quantity: 1,
        date: new Date("2025-06-15")
      },
      {
        _id: "sale003",
        user_id: "user001",
        clothing_id: "cloth003",
        quantity: 1,
        date: new Date("2025-06-16")
      },
      {
        _id: "sale004",
        user_id: "user002",
        clothing_id: "cloth002",
        quantity: 2,
        date: new Date("2025-06-17")
      }
    ]);

    // --- ACTUALIZAR DATOS ---

    // Actualizar stock en clothing
    await clothing.updateOne(
      { _id: "cloth001" },
      { $set: { in_stock: 115 } }
    );

    // Actualizar email de un usuario
    await users.updateOne(
      { _id: "user003" },
      { $set: { email: "c.ruiz@example.com" } }
    );

    // --- ELIMINAR DATOS ---

    // Eliminar una marca que no exista o que quieras borrar
    await brands.deleteOne({ _id: "brand999" }); // No hará nada si no existe

    // --- CONSULTAS ---

    // 1) Obtener la cantidad vendida de prendas por fecha y filtrar por una fecha específica.
    // Explicación: Agrupa ventas por fecha, suma cantidades y filtra por fecha '2025-06-15'.
    const dateFilter = new Date("2025-06-15");
    const salesByDate = await sales.aggregate([
      { $match: { date: dateFilter } },
      {
        $group: {
          _id: "$date",
          totalSold: { $sum: "$quantity" }
        }
      }
    ]).toArray();
    console.log("Cantidad vendida de prendas el 2025-06-15:", salesByDate);

    // 2) Obtener la lista de todas las marcas que tienen al menos una venta.
    // Explicación: Encuentra las prendas vendidas, obtiene sus marcas y lista marcas únicas.
    const soldClothingIds = await sales.distinct("clothing_id");
    const soldClothing = await clothing.find({ _id: { $in: soldClothingIds } }).toArray();
    const soldBrandIds = [...new Set(soldClothing.map(c => c.brand_id))];
    const brandsWithSales = await brands.find({ _id: { $in: soldBrandIds } }).toArray();
    console.log("Marcas con al menos una venta:", brandsWithSales);

    // 3) Obtener prendas vendidas y su cantidad restante en stock.
    // Explicación: Suma total vendido por prenda, luego calcula stock restante.
    const soldQuantities = await sales.aggregate([
      {
        $group: {
          _id: "$clothing_id",
          totalSold: { $sum: "$quantity" }
        }
      }
    ]).toArray();

    const result = [];
    for (const item of soldQuantities) {
      const cloth = await clothing.findOne({ _id: item._id });
      result.push({
        clothing_id: item._id,
        name: cloth.name,
        totalSold: item.totalSold,
        stockRemaining: cloth.in_stock - item.totalSold
      });
    }
    console.log("Prendas vendidas y stock restante:", result);

    // 4) Obtener listado de las 5 marcas más vendidas y su cantidad de ventas.
    // Explicación: Junta ventas con prendas para obtener marca, agrupa y ordena por ventas descendente, limita a 5.
    const topBrands = await sales.aggregate([
      {
        $lookup: {
          from: "clothing",
          localField: "clothing_id",
          foreignField: "_id",
          as: "clothingInfo"
        }
      },
      { $unwind: "$clothingInfo" },
      {
        $group: {
          _id: "$clothingInfo.brand_id",
          totalSales: { $sum: "$quantity" }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "brands",
          localField: "_id",
          foreignField: "_id",
          as: "brandInfo"
        }
      },
      { $unwind: "$brandInfo" },
      {
        $project: {
          _id: 0,
          brand: "$brandInfo.name",
          totalSales: 1
        }
      }
    ]).toArray();
    console.log("Top 5 marcas más vendidas:", topBrands);

  } catch (error) {
    console.error("Error en operaciones:", error);
  } finally {
    await client.close();
  }
}

main();
