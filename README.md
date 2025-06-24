# Sistema Online de Ropa

Este avance del proyecto consiste en la creación de una API con MongoDB y Git para una tienda de ropa, según lo solicitado en el curso de Desarrollo con Plataformas Abiertas.  
El sistema permite realizar operaciones básicas como inserción, actualización, eliminación y consultas (CRUD) avanzadas a través de una interfaz programada en Node.js.

---

## Colecciones en la Base de Datos `clothing-store-db`

### 1. Users (Usuarios)

Ejemplo de documento:

```json
{
  "_id": "user001",
  "name": "Gabriel Mata",
  "email": "gabriel.mata@example.com",
  "password": "hashedpassword1",
  "address": {
    "city": "Paraíso",
    "country": "Costa Rica"
  },
  "orders": ["cloth002", "cloth003"]
}
```
### 2. Brands (Marcas)

Ejemplo de documento:

```json
{
  "_id": "brand001",
  "name": "UrbanWear",
  "country": "USA",
  "founded": 2010
}
```

### 3. Clothing (Prendas)

Ejemplo de documento:

```json
{
  "_id": "cloth001",
  "name": "Slim Fit Jeans",
  "category": "Pants",
  "price": 49.99,
  "size": ["S", "M", "L", "XL"],
  "color": "Blue",
  "brand_id": "brand001",
  "in_stock": 120
}
```
---

## Integrantes del Proyecto:
- Julián Hernández