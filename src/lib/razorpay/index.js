import Razorpay from "razorpay";

export function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (
    !keyId ||
    !keySecret ||
    keyId === "your_razorpay_key_id" ||
    keySecret === "your_razorpay_key_secret"
  ) {
    throw new Error(
      "Razorpay is not configured. Add valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local."
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}
