import { Router, type IRouter } from "express";
import { db, deliveryPersonsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function formatDelivery(d: typeof deliveryPersonsTable.$inferSelect) {
  return {
    ...d,
    id: String(d.id),
    createdAt: d.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

router.post("/delivery/register", async (req, res) => {
  try {
    const { name, phone, email, password, vehicle } = req.body;
    
    const existing = await db.select().from(deliveryPersonsTable).where(eq(deliveryPersonsTable.email, email));
    if (existing.length > 0) {
      return res.status(400).json({ error: "Emaili ekziston tashmë" });
    }

    const [person] = await db.insert(deliveryPersonsTable).values({
      name, phone, email, password, vehicle,
      isAvailable: true,
    }).returning();

    res.status(201).json(formatDelivery(person));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/delivery/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [person] = await db.select().from(deliveryPersonsTable)
      .where(eq(deliveryPersonsTable.email, email));
    
    if (!person || person.password !== password) {
      return res.status(401).json({ error: "Email ose fjalëkalim i gabuar" });
    }

    res.json(formatDelivery(person));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
