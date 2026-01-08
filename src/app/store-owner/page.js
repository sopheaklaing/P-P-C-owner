"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Phone,
  Clock,
  FileText,
  CheckCheckIcon,
  CircleX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/spinner";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingOrders: 0,
    lowStockItems: 0,
  });

  const [loading, setLoading] = useState(true);
  const [currentStoreId, setCurrentStoreId] = useState(null);
  const [earnings, setEarnings] = useState({ card: 0, cash: 0 });

  const storeData = JSON.parse(localStorage.getItem("store_info"));

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      const storeId = storeData?.id;

      if (!storeId) {
        setCurrentStoreId(null);
        setStats({ totalProducts: 0, pendingOrders: 0, lowStockItems: 0 });
        return; // stop immediately if no store
      }

      setCurrentStoreId(storeId);

      // ✅ If store just created, no products or orders, skip fetch and set 0
      const { count: totalProducts } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId);

      const { count: pendingOrders } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId)
        .in("status", ["PENDING", "pending"]);

      setStats({
        totalProducts: totalProducts || 0,
        pendingOrders: pendingOrders || 0,
        lowStockItems: 0,
      });

      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, payment_method")
        .eq("store_id", storeId)
        .eq("status", "COMPLETED");

      // Sum earnings by payment method
      let cardTotal = 0;
      let cashTotal = 0;

      orders.forEach((order) => {
        if (order.payment_method?.toLowerCase() === "card") {
          cardTotal += parseFloat(order.total_amount);
        } else if (order.payment_method?.toLowerCase() === "cash") {
          cashTotal += parseFloat(order.total_amount);
        }
      });

      setEarnings({ card: cardTotal, cash: cashTotal });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // On error, just show 0 to prevent infinite loading
      setStats({ totalProducts: 0, pendingOrders: 0, lowStockItems: 0 });
    } finally {
      setLoading(false); // ✅ always stop loading
    }
  };

  // Load dashboard on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatNumber = (num) => new Intl.NumberFormat("en-US").format(num);

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Store overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadDashboardData}
            variant="outline"
            size="sm"
            className="h-10 gap-2"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Total Products */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {loading ? "..." : formatNumber(stats.totalProducts)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Products in your inventory
            </p>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {loading ? "..." : formatNumber(stats.pendingOrders)}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                Orders waiting for processing
              </p>
              {stats.pendingOrders > 0 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  Action needed
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              coming soon !
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">Below reorder level</p>
              <div className="text-xs text-red-500">coming soon !</div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-l-4 ${
            storeData.validated ? "border-l-green-500" : "border-l-red-500"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Store Validation from admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {storeData.validated ? (
                <span className="text-green-600">
                  <CheckCheckIcon /> Validated
                </span>
              ) : (
                <span className="text-red-600">
                  <CircleX /> Not Validated
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {storeData.validated
                ? "Your store products are visible to customers."
                : "Your store products are hidden until validation is complete."}
            </p>
          </CardContent>
        </Card>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card earnings */}
        <div className="p-4 bg-blue-100 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-600">Card Earnings</h2>
          {loading ? (
            <Spinner />
          ) : (
            <p className="text-2xl font-bold text-gray-800">
              ${earnings.card.toFixed(2)}
            </p>
          )}
        </div>

        {/* Cash earnings */}
        <div className="p-4 bg-green-100 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-600">Cash Earnings</h2>
          {loading ? (
            <Spinner />
          ) : (
            <p className="text-2xl font-bold text-gray-800">
              ${earnings.cash.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Store ID */}
      {currentStoreId && (
        <div className="text-xs text-gray-400 mb-4">
          Store ID: {currentStoreId}
        </div>
      )}

      {storeData && (
        <Card className="mb-6 border-l-4 border-l-green-500 bg-white shadow-md rounded-lg">
          <CardHeader className="pb-3 border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-gray-800">
              Store Info
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            {/* Address */}
            <div className="flex items-center gap-3 text-gray-700">
              <MapPin className="h-5 w-5 text-green-500" />
              <span className="text-sm sm:text-base">
                {storeData.address || (
                  <span className="text-red-500 italic">
                    Store location hasn't been set yet!
                  </span>
                )}
              </span>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 text-gray-700">
              <Phone className="h-5 w-5 text-green-500" />
              <span className="text-sm sm:text-base">
                {storeData.phone_number || (
                  <span className="text-red-500 italic">
                    Store phone number hasn't been set yet!
                  </span>
                )}
              </span>
            </div>

            {/* Working Hours */}
            <div className="flex items-center gap-3 text-gray-700">
              <Clock className="h-5 w-5 text-green-500" />
              <span className="text-sm sm:text-base">
                {storeData.start_time || "--"} - {storeData.close_time || "--"}
              </span>
            </div>

            {/* Business License */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-gray-700">
              <FileText className="h-5 w-5 text-green-500" />
              <span className="text-sm sm:text-base font-medium">
                Business License
              </span>
              {storeData.license_url ? (
                <img
                  src={storeData.license_url}
                  alt="Business License"
                  className="h-16 w-auto rounded border border-gray-300 shadow-sm"
                />
              ) : (
                <span className="text-red-500 italic text-sm">
                  Haven't uploaded yet!
                </span>
              )}
            </div>

            {/* Pharmacy License */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-gray-700">
              <FileText className="h-5 w-5 text-green-500" />
              <span className="text-sm sm:text-base font-medium">
                Pharmacy License
              </span>
              {storeData.pharmacy_license ? (
                <img
                  src={storeData.pharmacy_license}
                  alt="Pharmacy License"
                  className="h-16 w-auto rounded border border-gray-300 shadow-sm"
                />
              ) : (
                <span className="text-red-500 italic text-sm">
                  Haven't uploaded yet!
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Store */}
      {!currentStoreId && !loading && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          ⚠️ No store found for this account. Register a store or contact the
          administrator.
        </div>
      )}
    </div>
  );
}
