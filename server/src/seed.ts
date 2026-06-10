import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { User, Category, MenuItem, Coupon, Order, Review } from "./models/index.js";
import { hashPassword } from "./utils/auth.js";
import { slugify, genOrderNumber } from "./utils/helpers.js";

async function run() {
  await connectDB(process.env.MONGODB_URI || "");
  console.log("🌱 Seeding database…");

  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    MenuItem.deleteMany({}),
    Coupon.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // ── Users ──────────────────────────────────────────────
  const admin = await User.create({
    name: "Didi Bhaiya Admin",
    email: (process.env.SEED_ADMIN_EMAIL || "admin@didibhaiyakibiryani.com").toLowerCase(),
    phone: "9000000000",
    passwordHash: await hashPassword(process.env.SEED_ADMIN_PASSWORD || "Admin@123"),
    role: "ADMIN",
  });

  const customer = await User.create({
    name: "Ananya Sharma",
    email: "ananya@example.com",
    phone: "9876543210",
    passwordHash: await hashPassword("Test@123"),
    role: "CUSTOMER",
    addresses: [
      {
        label: "Home",
        line1: "12, 4th Cross, Indiranagar",
        line2: "Near CMH Road",
        city: "Bengaluru",
        pincode: "560038",
        isDefault: true,
      },
    ],
  });

  // ── Categories ─────────────────────────────────────────
  const cat = async (name: string, sortOrder: number, description = "") =>
    Category.create({ name, slug: slugify(name), sortOrder, description, isActive: true });

  const biryani = await cat("Biryani", 1, "Slow dum-cooked veg biryanis");
  const combos = await cat("Combos", 2, "Biryani + sides, value packs");
  const sides = await cat("Sides & Raita", 3, "Perfect companions");
  const desserts = await cat("Desserts", 4, "The happy ending");
  const beverages = await cat("Beverages", 5, "Cool it down");

  // ── Menu items ─────────────────────────────────────────
  const item = (data: Record<string, unknown> & { name: string }) =>
    ({ ...data, slug: slugify(data.name) });

  const items = await MenuItem.insertMany([
    item({
      name: "Hyderabadi Veg Dum",
      description:
        "Long-grain basmati, fried onion, mint & saffron — dum-sealed the classic Hyderabadi way.",
      price: 249,
      category: biryani._id,
      spiceLevel: 2,
      serves: "Serves 1–2",
      badge: "BESTSELLER",
      tags: ["bestseller", "classic"],
      rating: 4.8,
      ratingCount: 2140,
    }),
    item({
      name: "Paneer Tikka Biryani",
      description:
        "Char-grilled paneer tikka folded through smoky, spiced rice with caramelised onion.",
      price: 289,
      category: biryani._id,
      spiceLevel: 2,
      serves: "Serves 1–2",
      badge: "BESTSELLER",
      tags: ["bestseller", "paneer"],
      rating: 4.9,
      ratingCount: 1875,
    }),
    item({
      name: "Kathal (Jackfruit) Biryani",
      description:
        "Tender raw jackfruit braised in royal spices — the legendary veg 'meat' biryani.",
      price: 299,
      category: biryani._id,
      spiceLevel: 3,
      serves: "Serves 1–2",
      badge: "NEW",
      tags: ["new", "specialty"],
      rating: 4.7,
      ratingCount: 320,
    }),
    item({
      name: "Veg Tikka Biryani",
      description: "Mixed veg tikka, capsicum and onion layered with fragrant rice.",
      price: 239,
      category: biryani._id,
      spiceLevel: 2,
      serves: "Serves 1",
      rating: 4.6,
      ratingCount: 540,
    }),
    item({
      name: "Mushroom Dum Biryani",
      description: "Button mushrooms slow-cooked with whole spices and birista.",
      price: 259,
      category: biryani._id,
      spiceLevel: 1,
      serves: "Serves 1",
      rating: 4.5,
      ratingCount: 410,
    }),
    item({
      name: "Family Feast Combo",
      description: "2 Hyderabadi Veg Dum + 1 Paneer Tikka + 2 Gulab Jamun + raita.",
      price: 899,
      category: combos._id,
      spiceLevel: 2,
      serves: "Serves 3–4",
      badge: "BESTSELLER",
      tags: ["combo", "family"],
      rating: 4.8,
      ratingCount: 290,
    }),
    item({
      name: "Duo Combo",
      description: "Any 2 biryanis + 2 raita + 2 Gulab Jamun. Perfect for two.",
      price: 549,
      category: combos._id,
      spiceLevel: 2,
      serves: "Serves 2",
      tags: ["combo"],
      rating: 4.7,
      ratingCount: 180,
    }),
    item({
      name: "Burhani Raita",
      description: "Cool spiced yoghurt with roasted cumin and mint.",
      price: 49,
      category: sides._id,
      spiceLevel: 0,
      serves: "Serves 1",
      rating: 4.6,
      ratingCount: 800,
    }),
    item({
      name: "Mirchi ka Salan",
      description: "Tangy peanut-sesame gravy with green chillies.",
      price: 69,
      category: sides._id,
      spiceLevel: 3,
      serves: "Serves 1",
      rating: 4.5,
      ratingCount: 350,
    }),
    item({
      name: "Gulab Jamun (2 pc)",
      description: "Warm khoya dumplings soaked in rose-cardamom syrup. The happy ending.",
      price: 79,
      category: desserts._id,
      spiceLevel: 0,
      serves: "Serves 1",
      badge: "BESTSELLER",
      tags: ["dessert", "bestseller"],
      rating: 4.9,
      ratingCount: 1620,
    }),
    item({
      name: "Phirni",
      description: "Slow-cooked rice pudding with saffron, served chilled.",
      price: 89,
      category: desserts._id,
      spiceLevel: 0,
      serves: "Serves 1",
      rating: 4.6,
      ratingCount: 240,
    }),
    item({
      name: "Masala Chaas",
      description: "Spiced buttermilk to cool the dum down.",
      price: 39,
      category: beverages._id,
      spiceLevel: 0,
      serves: "Serves 1",
      rating: 4.4,
      ratingCount: 300,
    }),
    item({
      name: "Sweet Lassi",
      description: "Thick, creamy yoghurt lassi.",
      price: 59,
      category: beverages._id,
      spiceLevel: 0,
      serves: "Serves 1",
      rating: 4.7,
      ratingCount: 420,
    }),
  ]);

  const byName = (n: string) => items.find((i) => i.name === n)!;

  // ── Coupons ────────────────────────────────────────────
  await Coupon.insertMany([
    {
      code: "FIRST20",
      title: "20% off your first biryani",
      description: "Welcome to the family. 20% off (up to ₹120) on your very first order.",
      type: "PERCENT",
      value: 20,
      maxDiscount: 120,
      minOrder: 0,
      firstOrderOnly: true,
      isActive: true,
    },
    {
      code: "BIRYANI50",
      title: "Flat fifty, any order",
      description: "₹50 off on orders above ₹299.",
      type: "FLAT",
      value: 50,
      minOrder: 299,
      isActive: true,
    },
    {
      code: "HARBITE",
      title: "Feast a little harder",
      description: "₹75 off on orders above ₹499.",
      type: "FLAT",
      value: 75,
      minOrder: 499,
      isActive: true,
    },
    {
      code: "APPSWEET",
      title: "App-only: free dessert",
      description: "Free Gulab Jamun (2 pc) on any biryani — app only.",
      type: "FREE_ITEM",
      value: 0,
      minOrder: 199,
      freeItem: byName("Gulab Jamun (2 pc)")._id,
      appOnly: true,
      isActive: true,
    },
    {
      code: "FREESHIP",
      title: "Free delivery over ₹399",
      description: "No code needed — free delivery above ₹399.",
      type: "FREE_DELIVERY",
      value: 0,
      minOrder: 399,
      isActive: true,
    },
  ]);

  // ── Reviews (homepage testimonials) ────────────────────
  await Review.insertMany([
    {
      rating: 5,
      text: "Finally a veg biryani that doesn't feel like a compromise. The paneer tikka one is unreal.",
      authorName: "Ananya S.",
      authorMeta: "Indiranagar",
      user: customer._id,
    },
    {
      rating: 5,
      text: "Ordered for 40 people at the office. On time, hot, and everyone asked where it was from.",
      authorName: "Karan M.",
      authorMeta: "Office party",
    },
    {
      rating: 5,
      text: "The kathal biryani tastes just like my naani's. Har bite genuinely yaad reh gaya.",
      authorName: "Sneha P.",
      authorMeta: "HSR Layout",
    },
  ]);

  // ── Sample orders (for the dashboard) ──────────────────
  const mkOrder = async (
    daysAgo: number,
    lines: { item: ReturnType<typeof byName>; qty: number }[],
    status: string
  ) => {
    const orderItems = lines.map((l) => ({
      menuItem: l.item._id,
      name: l.item.name,
      price: l.item.price,
      qty: l.qty,
      spiceLevel: l.item.spiceLevel,
    }));
    const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
    const deliveryFee = subtotal >= 399 ? 0 : 39;
    const placedAt = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
    return Order.create({
      orderNumber: genOrderNumber(),
      user: customer._id,
      items: orderItems,
      subtotal,
      discount: 0,
      deliveryFee,
      total: subtotal + deliveryFee,
      status,
      paymentMethod: "COD",
      paymentStatus: status === "DELIVERED" ? "PAID" : "PENDING",
      address: {
        label: "Home",
        line1: "12, 4th Cross, Indiranagar",
        city: "Bengaluru",
        pincode: "560038",
        phone: "9876543210",
      },
      statusHistory: [{ status: "PLACED", at: placedAt }, { status, at: placedAt }],
      placedAt,
    });
  };

  await mkOrder(0, [{ item: byName("Hyderabadi Veg Dum"), qty: 2 }], "PREPARING");
  await mkOrder(0, [{ item: byName("Paneer Tikka Biryani"), qty: 1 }, { item: byName("Gulab Jamun (2 pc)"), qty: 1 }], "PLACED");
  await mkOrder(1, [{ item: byName("Family Feast Combo"), qty: 1 }], "DELIVERED");
  await mkOrder(2, [{ item: byName("Kathal (Jackfruit) Biryani"), qty: 2 }], "DELIVERED");
  await mkOrder(3, [{ item: byName("Duo Combo"), qty: 1 }], "DELIVERED");
  await mkOrder(5, [{ item: byName("Paneer Tikka Biryani"), qty: 3 }], "DELIVERED");

  console.log("✅ Seed complete.");
  console.log(`   Admin login:    ${admin.email} / ${process.env.SEED_ADMIN_PASSWORD || "Admin@123"}`);
  console.log(`   Customer login: ${customer.email} / Test@123`);
  console.log(`   ${items.length} menu items, 5 coupons, sample orders created.`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
