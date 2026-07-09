import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { getProduct, listProducts } from "../controllers/products.controller.js";
import { getCollection, listCollections } from "../controllers/collections.controller.js";
import { submitContact, subscribeNewsletter } from "../controllers/engagement.controller.js";
import { trackVisit, getLiveVisitors } from "../controllers/analytics.controller.js";
import { createOrder, getOrder, listOrdersByPhone } from "../controllers/orders.controller.js";
import { createPaymentOrder, verifyPayment } from "../controllers/payments.controller.js";
import { createReturn, listReturnsByPhone } from "../controllers/returns.controller.js";
import {
  applyOffer,
  createOffer,
  deleteOffer,
  getActiveOfferPublic,
  listOffers,
  setOfferActive,
  updateOffer,
} from "../controllers/offers.controller.js";
import {
  login,
  me,
  register,
  startPhoneOtp,
  verifyPhoneOtp,
} from "../controllers/auth.controller.js";
import {
  createProduct,
  deleteProduct,
  getAccounts,
  getStats,
  listAllOrders,
  getAdminOrder,
  listAllReturns,
  listCustomers,
  updateProduct,
  updateReturnStatus,
  uploadImage,
} from "../controllers/admin.controller.js";
import {
  createReview,
  listReviews,
  uploadReviewImage,
} from "../controllers/reviews.controller.js";

export const router = Router();

// In-memory upload (buffer is streamed to Supabase Storage, not saved to disk).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Catalog
router.get("/products", asyncHandler(listProducts));
router.get("/products/:handle", asyncHandler(getProduct));

// Reviews (ratings + feedback + photos)
router.get("/products/:handle/reviews", asyncHandler(listReviews));
router.post("/products/:handle/reviews", asyncHandler(createReview));
router.post("/reviews/upload", upload.single("file"), asyncHandler(uploadReviewImage));
router.get("/collections", asyncHandler(listCollections));
router.get("/collections/:handle", asyncHandler(getCollection));

// Engagement
router.post("/contact", asyncHandler(submitContact));
router.post("/newsletter", asyncHandler(subscribeNewsletter));

// Analytics — public heartbeat from storefront visitors (live-visitor tracking)
router.post("/track", asyncHandler(trackVisit));

// Orders
router.post("/orders", asyncHandler(createOrder));
router.get("/orders", asyncHandler(listOrdersByPhone));
router.get("/orders/:id", asyncHandler(getOrder));

// Payments (Razorpay online checkout: create order → verify signature → place)
router.post("/payments/razorpay/order", asyncHandler(createPaymentOrder));
router.post("/payments/razorpay/verify", asyncHandler(verifyPayment));

// Returns / replacements (child records under an order)
router.post("/returns", asyncHandler(createReturn));
router.get("/returns", asyncHandler(listReturnsByPhone));

// Offers — public: the active offer (for the announcement bar + promo popup)
router.get("/offers/active", asyncHandler(getActiveOfferPublic));
// Offers — public: preview/apply the active offer to a cart (+ optional code)
router.post("/offers/apply", asyncHandler(applyOffer));

// Auth (Supabase Auth)
router.post("/auth/register", asyncHandler(register));
router.post("/auth/login", asyncHandler(login));
router.get("/auth/me", asyncHandler(me));

// Phone OTP login
router.post("/auth/phone/start", asyncHandler(startPhoneOtp));
router.post("/auth/phone/verify", asyncHandler(verifyPhoneOtp));

// Admin — everything under /admin requires the admin key (x-admin-key header).
router.use("/admin", requireAdmin);
// Lightweight endpoint the frontend uses to validate the entered key.
router.get("/admin/verify", (_req, res) => res.json({ ok: true }));
router.post("/admin/upload", upload.single("file"), asyncHandler(uploadImage));
router.post("/admin/products", asyncHandler(createProduct));
router.put("/admin/products/:handle", asyncHandler(updateProduct));
router.delete("/admin/products/:handle", asyncHandler(deleteProduct));
router.get("/admin/stats", asyncHandler(getStats));
router.get("/admin/live", asyncHandler(getLiveVisitors));
router.get("/admin/orders", asyncHandler(listAllOrders));
router.get("/admin/orders/:id", asyncHandler(getAdminOrder));
router.get("/admin/customers", asyncHandler(listCustomers));
router.get("/admin/accounts", asyncHandler(getAccounts));
router.get("/admin/returns", asyncHandler(listAllReturns));
router.patch("/admin/returns/:id", asyncHandler(updateReturnStatus));
router.get("/admin/offers", asyncHandler(listOffers));
router.post("/admin/offers", asyncHandler(createOffer));
router.put("/admin/offers/:id", asyncHandler(updateOffer));
router.patch("/admin/offers/:id/active", asyncHandler(setOfferActive));
router.delete("/admin/offers/:id", asyncHandler(deleteOffer));
