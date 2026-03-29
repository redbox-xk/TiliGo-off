import { Router, type IRouter } from "express";
import { db, ordersTable, shopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

function generateCouponCode(): string {
  return "TLG-" + crypto.randomBytes(3).toString("hex").toUpperCase();
}

function estimateDeliveryMinutes(status: string): string {
  switch (status) {
    case "pending": return "35-50 min";
    case "accepted": return "25-40 min";
    case "preparing": return "15-30 min";
    case "picked_up": return "5-15 min";
    case "delivered": return "0 min";
    default: return "30-45 min";
  }
}

function formatOrder(order: typeof ordersTable.$inferSelect) {
  return {
    ...order,
    id: String(order.id),
    shopId: String(order.shopId),
    estimatedDeliveryTime: order.estimatedDeliveryTime ?? estimateDeliveryMinutes(order.status),
    createdAt: order.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: order.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

router.get("/orders", async (req, res) => {
  try {
    const { shopId, deliveryPersonId, status } = req.query;
    const orders = await db.select().from(ordersTable);
    
    let filtered = orders;
    if (shopId) filtered = filtered.filter(o => String(o.shopId) === shopId);
    if (deliveryPersonId) filtered = filtered.filter(o => o.deliveryPersonId === deliveryPersonId);
    if (status) {
      const statuses = String(status).split(",");
      filtered = filtered.filter(o => statuses.includes(o.status));
    }
    
    filtered.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    res.json(filtered.map(formatOrder));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const {
      shopId, customerName, customerPhone, customerAddress,
      customerLat, customerLng, items, notes,
    } = req.body;
    
    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, Number(shopId)));
    if (!shop) return res.status(404).json({ error: "Dyqani nuk u gjet" });
    
    const totalAmount = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity),
      0
    );
    
    const couponCode = generateCouponCode();
    
    const [order] = await db.insert(ordersTable).values({
      shopId: Number(shopId),
      shopName: shop.name,
      shopLat: shop.lat ?? 42.6629,
      shopLng: shop.lng ?? 21.1655,
      customerName,
      customerPhone,
      customerAddress,
      customerLat: customerLat ?? null,
      customerLng: customerLng ?? null,
      items,
      totalAmount,
      deliveryFee: shop.deliveryFee ?? 1.5,
      notes,
      status: "pending",
      couponCode,
      estimatedDeliveryTime: "35-50 min",
    }).returning();

    res.status(201).json(formatOrder(order));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const [order] = await db.select().from(ordersTable)
      .where(eq(ordersTable.id, Number(orderId)));
    
    if (!order) return res.status(404).json({ error: "Porosia nuk u gjet" });
    res.json(formatOrder(order));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      status, deliveryPersonId, deliveryPersonName,
      estimatedDeliveryTime, deliveryLat, deliveryLng,
    } = req.body;
    
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) {
      updateData.status = status;
      updateData.estimatedDeliveryTime = estimateDeliveryMinutes(status);
    }
    if (deliveryPersonId !== undefined) updateData.deliveryPersonId = String(deliveryPersonId);
    if (deliveryPersonName !== undefined) updateData.deliveryPersonName = deliveryPersonName;
    if (estimatedDeliveryTime !== undefined) updateData.estimatedDeliveryTime = estimatedDeliveryTime;
    if (deliveryLat !== undefined) updateData.deliveryLat = deliveryLat;
    if (deliveryLng !== undefined) updateData.deliveryLng = deliveryLng;
    
    const [order] = await db.update(ordersTable)
      .set(updateData)
      .where(eq(ordersTable.id, Number(orderId)))
      .returning();
    
    if (!order) return res.status(404).json({ error: "Porosia nuk u gjet" });
    res.json(formatOrder(order));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
