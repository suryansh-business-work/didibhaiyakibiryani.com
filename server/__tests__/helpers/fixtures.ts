import { User, Order } from "../../src/models/index.js";
import { hashPassword } from "../../src/utils/auth.js";
import type { Role } from "../../src/models/index.js";

let seq = 0;

export async function makeUser(role: Role = "CUSTOMER", over: Record<string, unknown> = {}) {
  seq += 1;
  return User.create({
    name: `User ${seq}`,
    email: `user${seq}@b.com`,
    passwordHash: await hashPassword("secret1"),
    role,
    ...over,
  });
}

export async function makeOrder(userId: string, over: Record<string, unknown> = {}) {
  seq += 1;
  return Order.create({
    orderNumber: `DDB-${1000 + seq}`,
    user: userId,
    items: [{ name: "Veg Biryani", price: 199, qty: 2 }],
    subtotal: 398,
    discount: 0,
    deliveryFee: 39,
    total: 437,
    address: { line1: "1 MG Rd", city: "Bengaluru", pincode: "560001", phone: "9000000000" },
    status: "PLACED",
    paymentMethod: "COD",
    paymentStatus: "PENDING",
    ...over,
  });
}
