import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Banner, Society, Settings, SETTINGS_KEY, getOrCreateSettings } from "../models/index.js";

/**
 * Idempotent production updates (safe to re-run — upserts only, no deletes):
 *  1. Set delivery hours to 7 PM – 10 PM on the singleton Settings doc.
 *  2. Seed a few home-slider banners (matched by title).
 *  3. Seed a few delivery societies (matched by name).
 *
 * Admin can edit/replace all of these afterwards from the admin panel.
 */

const STORE_OPEN_TIME = "19:00";
const STORE_CLOSE_TIME = "22:00";

const SEED_BANNERS = [
  {
    title: "Dum-cooked, every single day",
    subtitle: "7 PM – 10 PM delivery",
    imageUrl:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=70",
    linkUrl: "",
    sortOrder: 1,
  },
  {
    title: "Paneer Tikka Biryani",
    subtitle: "Char-grilled, smoky, unreal",
    imageUrl:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=70",
    linkUrl: "",
    sortOrder: 2,
  },
  {
    title: "Har bite, yaad rahe",
    subtitle: "Family feast combos",
    imageUrl:
      "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1200&q=70",
    linkUrl: "",
    sortOrder: 3,
  },
];

const SEED_SOCIETIES = [
  { name: "Prestige Lakeside Habitat", area: "Whitefield", pincode: "560066", sortOrder: 1 },
  { name: "Sobha Dream Acres", area: "Panathur", pincode: "560087", sortOrder: 2 },
  { name: "Brigade Cornerstone Utopia", area: "Whitefield", pincode: "560066", sortOrder: 3 },
  { name: "Salarpuria Sattva Greenage", area: "Bommanahalli", pincode: "560068", sortOrder: 4 },
];

async function run() {
  await connectDB(process.env.MONGODB_URI || "");
  console.log("🛠  Applying idempotent updates…");

  // 1. Delivery hours → 7 PM – 10 PM
  await getOrCreateSettings();
  await Settings.updateOne(
    { key: SETTINGS_KEY },
    { $set: { storeOpenTime: STORE_OPEN_TIME, storeCloseTime: STORE_CLOSE_TIME } }
  ).exec();
  console.log(`   ✓ Store hours set to ${STORE_OPEN_TIME}–${STORE_CLOSE_TIME}`);

  // 2. Home-slider banners (upsert by title)
  for (const b of SEED_BANNERS) {
    await Banner.updateOne(
      { title: b.title },
      { $set: { ...b, isActive: true } },
      { upsert: true }
    ).exec();
  }
  console.log(`   ✓ ${SEED_BANNERS.length} slider banner(s) upserted`);

  // 3. Delivery societies (upsert by name)
  for (const s of SEED_SOCIETIES) {
    await Society.updateOne(
      { name: s.name },
      { $set: { ...s, isActive: true } },
      { upsert: true }
    ).exec();
  }
  console.log(`   ✓ ${SEED_SOCIETIES.length} society(ies) upserted`);

  const banners = await Banner.countDocuments({});
  const societies = await Society.countDocuments({});
  console.log(`✅ Done. Totals — banners: ${banners}, societies: ${societies}.`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ apply-updates failed:", err);
  process.exit(1);
});
