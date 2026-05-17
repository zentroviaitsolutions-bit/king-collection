"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/helpers/formatPrice";
import {
  calculateCouponDiscount,
  formatCouponValue,
  getCouponValidationMessage,
  getCouponSummary,
} from "@/lib/helpers/coupon";

const CHECKOUT_COUPON_STORAGE_KEY = "king-checkout-coupon";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, clearCart } = useCart();
  const { user, loading } = useAuth();

  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  const razorpayEnabled =
    !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID !== "your_razorpay_key_id";

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function fillUserData() {
      if (!user) return;

      const nextForm = {
        full_name: "",
        email: user.email || "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
        notes: "",
      };

      const [{ data: profile }, { data: address }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("addresses")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_default", true)
          .maybeSingle(),
      ]);

      if (profile) {
        nextForm.full_name = profile.full_name || "";
        nextForm.phone = profile.phone || "";
      }

      if (address) {
        nextForm.full_name = address.full_name || nextForm.full_name;
        nextForm.phone = address.phone || nextForm.phone;
        nextForm.address_line1 = address.line1 || "";
        nextForm.address_line2 = address.line2 || "";
        nextForm.city = address.city || "";
        nextForm.state = address.state || "";
        nextForm.postal_code = address.postal_code || "";
        nextForm.country = address.country || "India";
      }

      setForm((prev) => ({ ...prev, ...nextForm }));
    }

    fillUserData();
  }, [user]);

  useEffect(() => {
    async function fetchCoupons() {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) {
        console.error("Failed to fetch available coupons", error);
        return;
      }

      setAvailableCoupons(data || []);
    }

    fetchCoupons();
  }, []);

  const shipping = subtotal > 0 ? 99 : 0;
  const discount = useMemo(
    () => calculateCouponDiscount(appliedCoupon, subtotal, cart),
    [appliedCoupon, subtotal, cart]
  );
  const total = Math.max(0, subtotal + shipping - discount);

  useEffect(() => {
    try {
      const savedCoupon = sessionStorage.getItem(CHECKOUT_COUPON_STORAGE_KEY);
      if (!savedCoupon) return;

      const parsed = JSON.parse(savedCoupon);
      if (!parsed?.coupon) return;

      setCouponCode(parsed.coupon.code || "");
      setAppliedCoupon(parsed.coupon);
    } catch (error) {
      console.error("Failed to restore coupon", error);
      sessionStorage.removeItem(CHECKOUT_COUPON_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!appliedCoupon) {
      sessionStorage.removeItem(CHECKOUT_COUPON_STORAGE_KEY);
      return;
    }

    sessionStorage.setItem(
      CHECKOUT_COUPON_STORAGE_KEY,
      JSON.stringify({ coupon: appliedCoupon })
    );
  }, [appliedCoupon]);

  useEffect(() => {
    if (!appliedCoupon) return;

    const validationMessage = getCouponValidationMessage(
      appliedCoupon,
      subtotal,
      cart
    );

    if (validationMessage) {
      setAppliedCoupon(null);
      setCouponCode("");
      toast.error(validationMessage);
    }
  }, [appliedCoupon, subtotal, cart]);

  function changeHandler(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleApplyCoupon() {
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      toast.error("Enter a coupon code");
      return;
    }

    try {
      setCheckingCoupon(true);

      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Invalid coupon code");
        setAppliedCoupon(null);
        return;
      }

      const now = new Date();

      if (data.starts_at && new Date(data.starts_at) > now) {
        toast.error("This coupon is not active yet");
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < now) {
        toast.error("This coupon has expired");
        return;
      }

      if (data.usage_limit && data.used_count >= data.usage_limit) {
        toast.error("Coupon usage limit reached");
        return;
      }

      const validationMessage = getCouponValidationMessage(data, subtotal, cart);
      if (validationMessage) {
        toast.error(validationMessage);
        setAppliedCoupon(null);
        return;
      }

      const possibleDiscount = calculateCouponDiscount(data, subtotal, cart);

      if (!possibleDiscount) {
        toast.error(
          data.min_order_amount
            ? `Minimum order should be ${formatPrice(data.min_order_amount)}`
            : "Coupon is not applicable"
        );
        return;
      }

      setAppliedCoupon(data);
      setCouponCode(code);
      toast.success("Coupon applied successfully");
    } catch (error) {
      toast.error(error.message || "Failed to apply coupon");
    } finally {
      setCheckingCoupon(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    sessionStorage.removeItem(CHECKOUT_COUPON_STORAGE_KEY);
    toast.success("Coupon removed");
  }

  function validateForm() {
    if (!user) {
      toast.error("Please login first");
      router.push("/login");
      return false;
    }

    if (!cart.length) {
      toast.error("Your cart is empty");
      return false;
    }

    if (
      !form.full_name ||
      !form.phone ||
      !form.address_line1 ||
      !form.city ||
      !form.state ||
      !form.postal_code
    ) {
      toast.error("Please fill all required fields");
      return false;
    }

    // ✅ ADDED STOCK VALIDATION (YOUR REQUIREMENT)
    for (const item of cart) {
      if (item.stock !== undefined && Number(item.stock) <= 0) {
        toast.error(`${item.title} is out of stock`);
        return false;
      }

      if (
        item.stock !== undefined &&
        Number(item.quantity) > Number(item.stock)
      ) {
        toast.error(
          `Only ${item.stock} item(s) available for ${item.title}`
        );
        return false;
      }
    }

    return true;
  }

  async function increaseCouponCount() {
    if (appliedCoupon?.id) {
      await supabase
        .from("coupons")
        .update({
          used_count: Number(appliedCoupon.used_count || 0) + 1,
        })
        .eq("id", appliedCoupon.id);
    }
  }

  async function saveOrderBase(extra = {}) {
    const orderNumber = `KC${Date.now()}`;

    const orderPayload = {
      user_id: user.id,
      order_number: orderNumber,
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      address_line1: form.address_line1,
      address_line2: form.address_line2,
      city: form.city,
      state: form.state,
      postal_code: form.postal_code,
      country: form.country,
      subtotal,
      discount_amount: discount,
      shipping_amount: shipping,
      total_amount: total,
      coupon_code: appliedCoupon?.code || null,
      payment_method: paymentMethod,
      payment_status: paymentMethod === "cod" ? "pending" : "paid",
      order_status: "placed",
      notes: form.notes || "",
      ...extra,
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItemsPayload = cart.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      variant_id: item.variant_id || null,
      title: item.title,
      image_url: item.image,
      price: item.price,
      quantity: item.quantity,
      size: item.size || null,
      color: item.color || null,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload);

    if (itemsError) throw itemsError;

    await increaseCouponCount();

    return order;
  }

  async function placeCodOrder() {
    const order = await saveOrderBase({
      payment_method: "cod",
      payment_status: "pending",
    });

    clearCart();
    toast.success("Order placed successfully");
    router.push(`/order-success?order=${order.order_number}`);
  }

  async function placeRazorpayOrder() {
    const createOrderRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: total }),
    });

    const razorpayOrder = await createOrderRes.json();

    if (!createOrderRes.ok) {
      throw new Error(razorpayOrder.error || "Failed to create Razorpay order");
    }

    await new Promise((resolve, reject) => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "King Collection",
        description: "Order Payment",
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed");
            }

            const order = await saveOrderBase({
              payment_method: "razorpay",
              payment_status: "paid",
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
            });

            clearCart();
            toast.success("Payment successful");
            router.push(`/order-success?order=${order.order_number}`);
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        prefill: {
          name: form.full_name,
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: "#111111",
        },
        modal: {
          ondismiss: function () {
            reject(new Error("Payment cancelled"));
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  }

  async function placeOrder(e) {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setPlacingOrder(true);

      if (paymentMethod === "cod") {
        await placeCodOrder();
      } else {
        if (!razorpayEnabled) {
          throw new Error(
            "Online payment is not configured yet. Add valid Razorpay keys or use Cash on Delivery."
          );
        }
        if (!window.Razorpay) {
          throw new Error("Razorpay SDK not loaded");
        }
        await placeRazorpayOrder();
      }
    } catch (error) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-3xl border border-black/10 bg-white p-8">
          Loading checkout...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-black/50">
          Checkout
        </p>
        <h1 className="mt-2 text-4xl font-bold">Complete Your Order</h1>
      </div>

      {!cart.length ? (
        <div className="rounded-3xl border border-dashed border-black/15 bg-white p-10 text-center">
          <h2 className="text-2xl font-semibold">Your cart is empty</h2>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <form
            onSubmit={placeOrder}
            className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-8"
          >
            <h2 className="text-2xl font-semibold">Shipping Details</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={changeHandler}
                placeholder="Full Name *"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none md:col-span-2"
                required
              />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={changeHandler}
                placeholder="Email *"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                required
              />
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={changeHandler}
                placeholder="Phone *"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                required
              />
              <input
                type="text"
                name="address_line1"
                value={form.address_line1}
                onChange={changeHandler}
                placeholder="Address Line 1 *"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none md:col-span-2"
                required
              />
              <input
                type="text"
                name="address_line2"
                value={form.address_line2}
                onChange={changeHandler}
                placeholder="Address Line 2"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none md:col-span-2"
              />
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={changeHandler}
                placeholder="City *"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                required
              />
              <input
                type="text"
                name="state"
                value={form.state}
                onChange={changeHandler}
                placeholder="State *"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                required
              />
              <input
                type="text"
                name="postal_code"
                value={form.postal_code}
                onChange={changeHandler}
                placeholder="Postal Code *"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                required
              />
              <input
                type="text"
                name="country"
                value={form.country}
                onChange={changeHandler}
                placeholder="Country"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
              />
              <textarea
                name="notes"
                value={form.notes}
                onChange={changeHandler}
                placeholder="Order Notes"
                rows={4}
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none md:col-span-2"
              />
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold">Payment Method</h3>

              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 p-4">
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-sm text-black/60">
                      Pay when your order arrives.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 rounded-2xl border p-4 ${
                    razorpayEnabled
                      ? "cursor-pointer border-black/10"
                      : "cursor-not-allowed border-black/10 bg-black/5 opacity-70"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === "razorpay"}
                    onChange={() => setPaymentMethod("razorpay")}
                    disabled={!razorpayEnabled}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">Razorpay</p>
                    <p className="text-sm text-black/60">
                      {razorpayEnabled
                        ? "Pay securely online."
                        : "Unavailable until valid Razorpay keys are added to .env.local."}
                    </p>
                  </div>
                </label>
              </div>

              {!razorpayEnabled ? (
                <div className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Online payment is disabled because the project is still using
                  placeholder Razorpay keys in `.env.local`.
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={placingOrder}
              className="mt-8 rounded-2xl bg-black px-6 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {placingOrder
                ? "Processing..."
                : paymentMethod === "razorpay"
                ? "Pay with Razorpay"
                : "Place Order"}
            </button>
          </form>

          <div className="h-fit rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Order Summary</h2>

            <div className="mt-6 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.cartKey}
                  className="border-b border-black/5 pb-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-black/60">
                        Qty: {item.quantity}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-black/60">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </div>
                    </div>
                    <p className="font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium">
                Coupon Code
              </label>

              {!!availableCoupons.length && (
                <div className="mb-4 grid gap-3">
                  {availableCoupons.map((coupon) => (
                    <button
                      key={coupon.id}
                      type="button"
                      onClick={() => setCouponCode(coupon.code)}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-black/10 bg-black/3 px-4 py-3 text-left"
                    >
                      <div>
                        <p className="font-medium">{coupon.code}</p>
                        <p className="text-sm text-black/60">
                          {getCouponSummary(coupon)}
                        </p>
                      </div>
                      <span className="rounded-full bg-black px-3 py-1 text-xs uppercase tracking-[0.24em] text-white">
                        {formatCouponValue(coupon)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon"
                    className="flex-1 rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={checkingCoupon}
                    className="rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white"
                  >
                    {checkingCoupon ? "Checking..." : "Apply"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
                  <div>
                    <p className="font-medium text-green-700">
                      {appliedCoupon.code} applied
                    </p>
                    <p className="text-sm text-green-700/80">
                      You saved {formatPrice(discount)}
                    </p>
                    {appliedCoupon.category_id ? (
                      <p className="text-xs text-green-700/80">
                        Valid only for matching category items in your cart
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-sm font-medium text-red-600"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3 border-t border-black/10 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-black/60">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-black/60">Shipping</span>
                <span>{formatPrice(shipping)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-black/60">Discount</span>
                <span>- {formatPrice(discount)}</span>
              </div>

              <div className="flex items-center justify-between border-t border-black/10 pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
