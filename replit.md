# TiliGo — Kosovo Food Delivery App

## Overview
A professional Wolt/UberEats-style food delivery app for Kosovo, built in Albanian language using Expo React Native + Express API.

## Architecture
- **Monorepo**: pnpm workspace
- **Mobile app**: `artifacts/mobile` (Expo Router, React Native)
- **API server**: `artifacts/api-server` (Express + Drizzle ORM + PostgreSQL)
- **Shared DB schema**: `lib/db/src/schema/index.ts`

## Key Features
- Customer browsing & ordering (no registration required)
- Shop registration/login with full dashboard (order management, menu management with image upload)
- Delivery person registration/login with GPS tracking & earnings
- Live GPS tracking: delivery sends location every ~8s via `expo-location` → stored in DB → customers poll every 10s
- React Native Maps shows delivery pin on customer tracking screen (iOS/Android only)
- PDF coupon generation via `expo-print` + `expo-sharing`
- 20% delivery price markup: displayed to customers, base price stored for shops
- Image upload via `expo-image-picker` → base64 → API saves to `/uploads/` folder

## Branding
- Primary: #00A651 (TiliGo green)
- Secondary: #FF6B00 (orange)
- Blue: #0066CC
- Logo: `artifacts/mobile/assets/images/tiligo-logo.jpeg`

## API Routes
- `POST /api/shops/register` — shop registration
- `POST /api/shops/login` — shop login
- `GET/PATCH /api/shops/:id` — get/update shop
- `GET /api/shops` — list shops (with category filter)
- `GET /api/shops/:id/products` — products for shop
- `POST /api/products` — create product (with base64 image)
- `DELETE /api/products/:id` — delete product
- `POST /api/orders` — place order (auto-generates coupon code TLG-XXXXXX, auto-ETA)
- `GET /api/orders` — list orders (filter by shopId, deliveryId, status)
- `GET /api/orders/:id` — get single order
- `PATCH /api/orders/:id/status` — update order status
- `POST /api/delivery/register` — delivery person registration
- `POST /api/delivery/login` — delivery person login
- `PATCH /api/delivery/:id/location` — update delivery GPS location

## DB Schema (Drizzle ORM)
- `shopsTable` — shops with GPS fields (shopLat, shopLng)
- `productsTable` — menu items with imageUrl, suggestions, isAvailable
- `ordersTable` — orders with GPS fields (deliveryLat, deliveryLng, customerLat, customerLng), couponCode, estimatedTime
- `orderItemsTable` — individual items with suggestions
- `deliveryPersonsTable` — delivery users with vehicle, currentLat, currentLng

## Screens
| Screen | Path | Description |
|--------|------|-------------|
| Home | `(tabs)/index` | Shop browse with categories & promo banner |
| Search | `(tabs)/search` | Search shops by name/category |
| Cart | `(tabs)/orders` | Cart view with quantity control |
| Profile | `(tabs)/profile` | Auth portal & user info |
| Shop Detail | `shop/[id]` | Products with 20% markup display |
| Checkout | `cart` | Order form with customer details |
| Order Tracking | `order-tracking/[id]` | Live map + status timeline + PDF coupon |
| Shop Dashboard | `shop-dashboard` | Order management + menu + stats + open/closed toggle |
| Delivery Dashboard | `delivery-dashboard` | Available orders, GPS tracking, earnings |
| Add Product | `add-product` | Product form with image picker + delivery price preview |
| Shop Login/Register | `(auth)/shop-*` | Business auth screens |
| Delivery Login/Register | `(auth)/delivery-*` | Delivery auth screens |

## Demo Account
- Shop: `pica@kosova.com` / `test123`

## Environment Variables
- `EXPO_PUBLIC_DOMAIN` — Replit domain for API calls
- `DATABASE_URL` — PostgreSQL connection string
