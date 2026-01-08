import { supabase } from "@/lib/supabase";
import Image from "next/image";

const StoreOrderCard = ({ order, refresh }) => {
  const updateStatus = async (status) => {
    try {
      // ACCEPT → deduct stock
      if (status === "ACCEPTED") {
        for (const item of order.order_items) {
          const product = item.products[0];
          if (!product) continue;

          const { data } = await supabase
            .from("product_sale_units")
            .select("stock_quantity")
            .eq("product_id", product.id)
            .eq("unit_name", item.product_sale_unit)
            .single();

          const newStock = Math.max((data?.stock_quantity ?? 0) - item.quantity, 0);

          await supabase
            .from("product_sale_units")
            .update({ stock_quantity: newStock })
            .eq("product_id", product.id)
            .eq("unit_name", item.product_sale_unit);
        }
      }

      // COMPLETED → payment
      if (status === "COMPLETED") {
        if (order.payment_method === "card") {
          const res = await fetch("/api/capture-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: order.id }),
          });

          const result = await res.json();
          if (!result.success) return;
        }

        if (order.payment_method === "cash") {
          await supabase
            .from("payments")
            .update({ status: "CASH_PAID" })
            .eq("order_id", order.id);
        }
      }

      // Update order status
      await supabase.from("orders").update({ status }).eq("id", order.id);

      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const customer = order.users[0];

  return (
    <div className="border rounded-xl p-4 bg-white shadow-md hover:shadow-lg transition duration-300 mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2 sm:gap-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="font-semibold">Order #{order.id}</span>
          <span className="text-gray-500 text-sm">
            {customer?.first_name} {customer?.last_name}
          </span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-gray-600 text-sm">Status: {order.status}</span>
          <span className="font-semibold">${order.total_amount}</span>
        </div>
      </div>

      {/* Shipping Info */}
      <p className="text-gray-600 text-sm mb-3">
        {order.shipping_method === "delivery"
          ? `Delivery to: ${order.full_location}`
          : "Pickup at store"}
      </p>

      {/* Order Items */}
      <div className="divide-y divide-gray-200">
        {order.order_items.map((item, idx) => {
          const product = item.products[0];
          if (!product) return null;

          return (
            <div
              key={idx}
              className="flex items-center gap-3 py-2 text-sm"
            >
              {product.image_url && (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  width={50}
                  height={50}
                  className="rounded"
                />
              )}
              <div className="flex-1">
                <span className="font-medium">{product.name}</span>
                <div className="text-gray-500 text-xs">
                  {item.product_sale_unit} | {item.quantity} × ${item.price_at_purchase}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-4">
        {order.status === "PENDING" && (
          <>
            <button
              onClick={() => updateStatus("ACCEPTED")}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Accept
            </button>
            <button
              onClick={() => updateStatus("REJECTED")}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Reject
            </button>
          </>
        )}

        {order.status === "ACCEPTED" && order.shipping_method === "pickup" && (
          <button
            onClick={() => updateStatus("READY_FOR_PICKUP")}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Ready for Pickup
          </button>
        )}

        {order.status === "ACCEPTED" && order.shipping_method === "delivery" && (
          <button
            onClick={() => updateStatus("OUT_FOR_DELIVERY")}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Out for Delivery
          </button>
        )}

        {(order.status === "READY_FOR_PICKUP" || order.status === "OUT_FOR_DELIVERY") && (
          <button
            onClick={() => updateStatus("COMPLETED")}
            className="px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 transition"
          >
            Mark as Completed
          </button>
        )}
      </div>
    </div>
  );
};

export default StoreOrderCard;
