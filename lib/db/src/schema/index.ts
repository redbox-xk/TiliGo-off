import { pgTable, text, serial, boolean, real, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shopsTable = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  imageUrl: text("image_url"),
  rating: real("rating").default(4.5),
  reviewCount: integer("review_count").default(0),
  deliveryTime: text("delivery_time").default("20-35 min"),
  deliveryFee: real("delivery_fee").default(1.5),
  minOrder: real("min_order").default(3),
  isOpen: boolean("is_open").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShopSchema = createInsertSchema(shopsTable).omit({ id: true, createdAt: true, rating: true, reviewCount: true });
export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shopsTable.$inferSelect;

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull().references(() => shopsTable.id),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  imageUrl: text("image_url"),
  category: text("category"),
  isAvailable: boolean("is_available").default(true),
  suggestions: jsonb("suggestions").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;

export const deliveryPersonsTable = pgTable("delivery_persons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  vehicle: text("vehicle"),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDeliveryPersonSchema = createInsertSchema(deliveryPersonsTable).omit({ id: true, createdAt: true, isAvailable: true });
export type InsertDeliveryPerson = z.infer<typeof insertDeliveryPersonSchema>;
export type DeliveryPerson = typeof deliveryPersonsTable.$inferSelect;

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull().references(() => shopsTable.id),
  shopName: text("shop_name").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address").notNull(),
  items: jsonb("items").notNull().$type<Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    suggestions?: string[];
  }>>(),
  totalAmount: real("total_amount").notNull(),
  deliveryFee: real("delivery_fee").default(1.5),
  status: text("status").notNull().default("pending"),
  deliveryPersonId: text("delivery_person_id"),
  deliveryPersonName: text("delivery_person_name"),
  notes: text("notes"),
  estimatedDeliveryTime: text("estimated_delivery_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true, status: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
