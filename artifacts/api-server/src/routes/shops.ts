import { Router, type IRouter } from "express";
import { db, shopsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const router: IRouter = Router();

const uploadsDir = path.join(process.cwd(), "uploads");

function saveBase64Image(base64: string): string | null {
  try {
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) return null;
    const ext = matches[1].split("/")[1] ?? "jpg";
    const data = matches[2];
    const filename = crypto.randomBytes(8).toString("hex") + "." + ext;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, Buffer.from(data, "base64"));
    return `/uploads/${filename}`;
  } catch {
    return null;
  }
}

function formatShop(s: typeof shopsTable.$inferSelect) {
  return {
    ...s,
    id: String(s.id),
    rating: s.rating ?? 4.5,
    reviewCount: s.reviewCount ?? 0,
    deliveryTime: s.deliveryTime ?? "20-35 min",
    deliveryFee: s.deliveryFee ?? 1.5,
    minOrder: s.minOrder ?? 3,
    createdAt: s.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

router.get("/shops", async (req, res) => {
  try {
    const { category } = req.query;
    const shops = await db.select().from(shopsTable);
    const filtered = category ? shops.filter(s => s.category === category) : shops;
    res.json(filtered.map(formatShop));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/shops", async (req, res) => {
  try {
    const {
      name, description, category, address, city, phone, email, password,
      imageUrl, imageBase64, deliveryTime, deliveryFee, minOrder, lat, lng,
    } = req.body;
    
    const existing = await db.select().from(shopsTable).where(eq(shopsTable.email, email));
    if (existing.length > 0) {
      return res.status(400).json({ error: "Emaili ekziston tashmë" });
    }

    let finalImageUrl = imageUrl;
    if (imageBase64) {
      const saved = saveBase64Image(imageBase64);
      if (saved) finalImageUrl = saved;
    }

    const [shop] = await db.insert(shopsTable).values({
      name, description, category, address, city, phone, email, password,
      imageUrl: finalImageUrl, deliveryTime, deliveryFee, minOrder,
      lat: lat ?? 42.6629, lng: lng ?? 21.1655,
    }).returning();

    res.status(201).json(formatShop(shop));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/shops/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.email, email));
    
    if (!shop || shop.password !== password) {
      return res.status(401).json({ error: "Email ose fjalëkalim i gabuar" });
    }
    res.json(formatShop(shop));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/shops/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, Number(shopId)));
    if (!shop) return res.status(404).json({ error: "Dyqani nuk u gjet" });
    res.json(formatShop(shop));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/shops/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    const { isOpen, name, description, deliveryTime, deliveryFee, minOrder, imageUrl, imageBase64 } = req.body;
    
    const updateData: Record<string, unknown> = {};
    if (isOpen !== undefined) updateData.isOpen = isOpen;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (deliveryTime !== undefined) updateData.deliveryTime = deliveryTime;
    if (deliveryFee !== undefined) updateData.deliveryFee = deliveryFee;
    if (minOrder !== undefined) updateData.minOrder = minOrder;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (imageBase64) {
      const saved = saveBase64Image(imageBase64);
      if (saved) updateData.imageUrl = saved;
    }

    const [shop] = await db.update(shopsTable).set(updateData).where(eq(shopsTable.id, Number(shopId))).returning();
    if (!shop) return res.status(404).json({ error: "Dyqani nuk u gjet" });
    res.json(formatShop(shop));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/shops/:shopId/products", async (req, res) => {
  try {
    const { shopId } = req.params;
    const products = await db.select().from(productsTable).where(eq(productsTable.shopId, Number(shopId)));
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
    const { name, description, price, imageUrl, imageBase64, category, isAvailable, suggestions } = req.body;
    
    let finalImageUrl = imageUrl;
    if (imageBase64) {
      const saved = saveBase64Image(imageBase64);
      if (saved) finalImageUrl = saved;
    }

    const [product] = await db.insert(productsTable).values({
      shopId: Number(shopId),
      name, description, price: Number(price),
      imageUrl: finalImageUrl, category,
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
    const { name, description, price, imageUrl, imageBase64, category, isAvailable, suggestions } = req.body;
    
    let finalImageUrl = imageUrl;
    if (imageBase64) {
      const saved = saveBase64Image(imageBase64);
      if (saved) finalImageUrl = saved;
    }
    
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (finalImageUrl !== undefined) updateData.imageUrl = finalImageUrl;
    if (category !== undefined) updateData.category = category;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (suggestions !== undefined) updateData.suggestions = suggestions;

    const [product] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, Number(productId))).returning();

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
