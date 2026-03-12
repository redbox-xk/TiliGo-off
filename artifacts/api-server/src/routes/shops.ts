import { Router, type IRouter } from "express";
import { db, shopsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/shops", async (req, res) => {
  try {
    const { category } = req.query;
    let query = db.select().from(shopsTable);
    const shops = await query;
    const filtered = category
      ? shops.filter(s => s.category === category)
      : shops;
    
    res.json(filtered.map(s => ({
      ...s,
      id: String(s.id),
      rating: s.rating ?? 4.5,
      reviewCount: s.reviewCount ?? 0,
      deliveryTime: s.deliveryTime ?? "20-35 min",
      deliveryFee: s.deliveryFee ?? 1.5,
      minOrder: s.minOrder ?? 3,
      createdAt: s.createdAt?.toISOString() ?? new Date().toISOString(),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/shops", async (req, res) => {
  try {
    const { name, description, category, address, city, phone, email, password, imageUrl, deliveryTime, deliveryFee, minOrder } = req.body;
    
    const existing = await db.select().from(shopsTable).where(eq(shopsTable.email, email));
    if (existing.length > 0) {
      return res.status(400).json({ error: "Emaili ekziston tashmë" });
    }

    const [shop] = await db.insert(shopsTable).values({
      name, description, category, address, city, phone, email, password,
      imageUrl, deliveryTime, deliveryFee, minOrder,
    }).returning();

    res.status(201).json({
      ...shop,
      id: String(shop.id),
      createdAt: shop.createdAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/shops/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [shop] = await db.select().from(shopsTable)
      .where(eq(shopsTable.email, email));
    
    if (!shop || shop.password !== password) {
      return res.status(401).json({ error: "Email ose fjalëkalim i gabuar" });
    }

    res.json({
      ...shop,
      id: String(shop.id),
      createdAt: shop.createdAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/shops/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    const [shop] = await db.select().from(shopsTable)
      .where(eq(shopsTable.id, Number(shopId)));
    
    if (!shop) return res.status(404).json({ error: "Dyqani nuk u gjet" });
    
    res.json({
      ...shop,
      id: String(shop.id),
      createdAt: shop.createdAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/shops/:shopId/products", async (req, res) => {
  try {
    const { shopId } = req.params;
    const products = await db.select().from(productsTable)
      .where(eq(productsTable.shopId, Number(shopId)));
    
    res.json(products.map(p => ({
      ...p,
      id: String(p.id),
      shopId: String(p.shopId),
      suggestions: p.suggestions ?? [],
      createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/shops/:shopId/products", async (req, res) => {
  try {
    const { shopId } = req.params;
    const { name, description, price, imageUrl, category, isAvailable, suggestions } = req.body;
    
    const [product] = await db.insert(productsTable).values({
      shopId: Number(shopId),
      name, description, price,
      imageUrl, category,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      suggestions: suggestions ?? [],
    }).returning();

    res.status(201).json({
      ...product,
      id: String(product.id),
      shopId: String(product.shopId),
      suggestions: product.suggestions ?? [],
      createdAt: product.createdAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/shops/:shopId/products/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, price, imageUrl, category, isAvailable, suggestions } = req.body;
    
    const [product] = await db.update(productsTable)
      .set({ name, description, price, imageUrl, category, isAvailable, suggestions })
      .where(eq(productsTable.id, Number(productId)))
      .returning();

    res.json({
      ...product,
      id: String(product.id),
      shopId: String(product.shopId),
      suggestions: product.suggestions ?? [],
      createdAt: product.createdAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/shops/:shopId/products/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    await db.delete(productsTable).where(eq(productsTable.id, Number(productId)));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
