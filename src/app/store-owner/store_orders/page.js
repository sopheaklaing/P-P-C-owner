"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StoreOrderCard from "@/components/orderCard";

const StoreOrdersUI = () => {
  const [orders, setOrders] = useState([]);
  
  const storeData = JSON.parse(localStorage.getItem("store_info"));
  const storeId = storeData.id

  useEffect(() => {
    if (storeId) fetchStoreOrders();
  }, [storeId]);

  const fetchStoreOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        total_amount,
        shipping_method,
        status,
        payment_method,
        full_location,
        created_at,
        users ( first_name, last_name),
        order_items (
          quantity,
          price_at_purchase,
          product_sale_unit,
          products ( id, name, image_url)
        )
      `
      )
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    const transformedOrders = (data || []).map((order) => ({
      id: order.id,
      total_amount: order.total_amount,
      shipping_method: order.shipping_method,
      status: order.status,
      payment_method: order.payment_method,
      full_location: order.full_location,
      created_at: order.created_at,
      users: order.users
        ? [
            {
              first_name: order.users.first_name,
              last_name: order.users.last_name,
            },
          ]
        : [],
      order_items: order.order_items
        ? order.order_items.map((item) => ({
            quantity: item.quantity,
            price_at_purchase: item.price_at_purchase,
            product_sale_unit: item.product_sale_unit,
            products: item.products
              ? [
                  {
                    id: item.products.id,
                    name: item.products.name,
                    image_url: item.products.image_url,
                  },
                ]
              : [],
          }))
        : [],
    }));

    setOrders(transformedOrders);
  };

  // Divide orders by status
  const completedOrders = orders.filter(
    (order) => order.status === "COMPLETED"
  );
  const pendingOrders = orders.filter((order) => order.status === "PENDING");
  const otherOrders = orders.filter(
    (order) => order.status !== "COMPLETED" && order.status !== "PENDING"
  );

  return (
    <div className="space-y-8">
      {/* Pending Orders */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Pending Orders</h2>
        {pendingOrders.length > 0 ? (
          pendingOrders.map((order) => (
            <StoreOrderCard
              key={order.id}
              order={order}
              refresh={fetchStoreOrders}
            />
          ))
        ) : (
          <p className="text-gray-500">No pending orders.</p>
        )}
      </div>

      {/* Other Orders */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Proccessing</h2>
        {otherOrders.length > 0 ? (
          otherOrders.map((order) => (
            <StoreOrderCard
              key={order.id}
              order={order}
              refresh={fetchStoreOrders}
            />
          ))
        ) : (
          <p className="text-gray-500">No proccessing orders.</p>
        )}
      </div>

      {/* Completed Orders */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Completed Orders</h2>
        {completedOrders.length > 0 ? (
          completedOrders.map((order) => (
            <StoreOrderCard
              key={order.id}
              order={order}
              refresh={fetchStoreOrders}
            />
          ))
        ) : (
          <p className="text-gray-500">No completed orders.</p>
        )}
      </div>
    </div>
  );
};

export default StoreOrdersUI;
