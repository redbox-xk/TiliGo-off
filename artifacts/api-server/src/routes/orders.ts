import { Router, type IRouter } from "express";
import { db, ordersTable, shopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function formatOrder(order: typeof ordersTable.$inferSelect) {
  return {
    ...order,
    id: String(order.id),
    shopId: String(order.shopId),
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
    if (status) filtered = filtered.filter(o => o.status === status);
    
    res.json(filtered.map(formatOrder));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const { shopId, customerName, customerPhone, customerAddress, items, notes } = req.body;
    
    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, Number(shopId)));
    if (!shop) return res.status(404).json({ error: "Dyqani nuk u gjet" });
    
    const totalAmount = items.reduce((sum: number, item: { price: number; quantity: number }) => 
      sum + (item.price * item.quantity), 0);
    
    const [order] = await db.insert(ordersTable).values({
      shopId: Number(shopId),
      shopName: shop.name,
      customerName,
      customerPhone,
      customerAddress,
      items,
      totalAmount,
      deliveryFee: shop.deliveryFee ?? 1.5,
      notes,
      status: "pending",
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
    const { status, deliveryPersonId, deliveryPersonName, estimatedDeliveryTime } = req.body;
    
    const updateData: Record<string, unknown> = { 
      status, 
      updatedAt: new Date(),
    };
    if (deliveryPersonId) updateData.deliveryPersonId = deliveryPersonId;
    if (deliveryPersonName) updateData.deliveryPersonName = deliveryPersonName;
    if (estimatedDeliveryTime) updateData.estimatedDeliveryTime = estimatedDeliveryTime;
    
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
