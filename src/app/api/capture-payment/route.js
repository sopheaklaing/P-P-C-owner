
import { promises as fs } from "fs";
import path from "path";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { orderId } = await req.json();

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return Response.json({ success: false, error: "Order not found" });
    }

    if (!order.stripe_payment_intent) {
      return Response.json({ success: false, error: "No Stripe payment intent" });
    }

    // Capture payment
    const paymentIntent = await stripe.paymentIntents.capture(order.stripe_payment_intent);

    // Update payment record
    await supabase
      .from("payments")
      .update({ status: "CAPTURED" })
      .eq("order_id", orderId);

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: err.message });
  }
}