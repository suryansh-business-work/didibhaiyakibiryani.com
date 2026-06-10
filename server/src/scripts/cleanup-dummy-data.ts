import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import {
  User,
  Category,
  MenuItem,
  Coupon,
  Order,
  Payment,
  Review,
  Campaign,
  Otp,
} from "../models/index.js";

/**
 * One-off production cleanup: removes everything the seed script created so
 * the store starts from real, admin-entered data only.
 *
 * Kept: all user accounts (except the seeded demo customer), the Settings
 * document, and any menu items / categories / coupons created by hand in the
 * admin panel (they don't match the seed names below).
 */

const SEED_MENU_ITEM_NAMES = [
  "Hyderabadi Veg Dum",
  "Paneer Tikka Biryani",
  "Kathal (Jackfruit) Biryani",
  "Veg Tikka Biryani",
  "Mushroom Dum Biryani",
  "Family Feast Combo",
  "Duo Combo",
  "Burhani Raita",
  "Mirchi ka Salan",
  "Gulab Jamun (2 pc)",
  "Phirni",
  "Masala Chaas",
  "Sweet Lassi",
];

const SEED_CATEGORY_NAMES = ["Biryani", "Combos", "Sides & Raita", "Desserts", "Beverages"];
const SEED_COUPON_CODES = ["FIRST20", "BIRYANI50", "HARBITE", "APPSWEET", "FREESHIP"];
const SEED_REVIEW_AUTHORS = ["Ananya S.", "Karan M.", "Sneha P."];
const SEED_DEMO_CUSTOMER_EMAIL = "ananya@example.com";

async function run() {
  await connectDB(process.env.MONGODB_URI || "");
  console.log("🧹 Removing seeded dummy data (keeping real users + admin-created records)…");

  // Demo/test transactional data: all of it came from the seed or test runs.
  const orders = await Order.deleteMany({});
  const payments = await Payment.deleteMany({});
  const campaigns = await Campaign.deleteMany({});
  const otps = await Otp.deleteMany({});
  const reviews = await Review.deleteMany({ authorName: { $in: SEED_REVIEW_AUTHORS } });

  // Seeded catalogue rows (admin-created items have different names and survive).
  const items = await MenuItem.deleteMany({ name: { $in: SEED_MENU_ITEM_NAMES } });
  const coupons = await Coupon.deleteMany({ code: { $in: SEED_COUPON_CODES } });

  // Seeded categories — only when no (admin-created) menu items still use them.
  let categoriesRemoved = 0;
  const seedCats = await Category.find({ name: { $in: SEED_CATEGORY_NAMES } }).exec();
  for (const cat of seedCats) {
    const inUse = await MenuItem.countDocuments({ category: cat._id });
    if (inUse === 0) {
      await Category.deleteOne({ _id: cat._id });
      categoriesRemoved += 1;
    } else {
      console.log(`   ↷ kept category "${cat.name}" — ${inUse} live item(s) use it`);
    }
  }

  // The seeded demo customer (real users are untouched).
  const demoUser = await User.deleteMany({ email: SEED_DEMO_CUSTOMER_EMAIL });

  console.log("✅ Cleanup complete:");
  console.log(`   orders: ${orders.deletedCount}, payments: ${payments.deletedCount}, campaigns: ${campaigns.deletedCount}, otps: ${otps.deletedCount}`);
  console.log(`   menu items: ${items.deletedCount}, categories: ${categoriesRemoved}, coupons: ${coupons.deletedCount}, reviews: ${reviews.deletedCount}`);
  console.log(`   demo customers: ${demoUser.deletedCount}`);

  const remainingItems = await MenuItem.countDocuments({});
  const remainingUsers = await User.countDocuments({});
  console.log(`   remaining: ${remainingItems} menu item(s), ${remainingUsers} user(s).`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Cleanup failed:", err);
  process.exit(1);
});
