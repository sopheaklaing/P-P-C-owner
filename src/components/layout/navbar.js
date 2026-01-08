"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Header({ onToggleSidebar, isSidebarOpen }) {
  const [user, setUser] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentStoreId, setCurrentStoreId] = useState(null);
  const dropdownRef = useRef(null);
  const router = useRouter();

  //   const userData = {
  //   id: "13",
  //   email: "sopheaksol71@gmail.com",
  //   first_name: "sol",
  //   last_name: "sopheak",
  //   role: "owner",
  //   phone_number: "0714661812",
  //   auth_id: "b31179e3-8004-4406-a03c-ee0449ecd2b5",
  // };

  const userData = JSON.parse(localStorage.getItem("user_info"));
  const storeData = JSON.parse(localStorage.getItem("store_info"));

  /* ---------------- GET USER STORE ---------------- */
  const getUserStore = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return null;

      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", data.user.id)
        .maybeSingle();

      if (!userRow?.id) return null;

      const { data: storeRow } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", userRow.id)
        .maybeSingle();

      return storeRow?.id || null;
    } catch (e) {
      console.error("getUserStore error:", e);
      return null;
    }
  };

  /* ---------------- HELPERS ---------------- */
  const getCustomerNameFromOrder = (order) => {
    if (order.users?.length) {
      const u = order.users[0];
      return `${u.first_name} ${u.last_name}`.trim();
    }
    return "Customer";
  };

  const getTimeAgo = (dateString) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    if (hrs < 24) return `${hrs} hr ago`;
    return `${days} days ago`;
  };

  /* ---------------- FETCH ORDERS ---------------- */
  const fetchRecentOrders = async () => {
    let storeId = currentStoreId;
    if (!storeId) {
      storeId = await getUserStore();
      setCurrentStoreId(storeId);
    }
    if (!storeId) return;

    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        created_at,
        users ( first_name, last_name )
      `)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(10);

    const orderNotifications = (orders || []).map((order) => ({
      id: `order-${order.id}`,
      title: `New Order #${order.id}`,
      message: `${getCustomerNameFromOrder(order)} placed an order for $${order.total_amount.toFixed(2)}`,
      time: getTimeAgo(order.created_at),
      type: "order",
      read: false,
      orderId: order.id.toString(),
      created_at: order.created_at,
    }));

    const stored = getStoredNotifications().filter(n => n.type !== "order");
    const all = [...orderNotifications, ...stored].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

    setNotifications(all);
    setUnreadCount(all.filter(n => !n.read).length);
    storeNotifications(all);
  };

  /* ---------------- REALTIME ---------------- */
  useEffect(() => {
    if (!currentStoreId) return;

    const channel = supabase
      .channel(`store-orders-${currentStoreId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${currentStoreId}`,
        },
        async (payload) => {
          const { data: order } = await supabase
            .from("orders")
            .select(`
              id,
              total_amount,
              created_at,
              users ( first_name, last_name )
            `)
            .eq("id", payload.new.id)
            .single();

          if (!order) return;

          const newNotification = {
            id: `order-${order.id}`,
            title: `New Order #${order.id}`,
            message: `${getCustomerNameFromOrder(order)} placed an order for $${order.total_amount.toFixed(2)}`,
            time: "Just now",
            type: "order",
            read: false,
            orderId: order.id.toString(),
            created_at: order.created_at,
          };

          setNotifications(prev => {
            const updated = [newNotification, ...prev.filter(n => n.id !== newNotification.id)];
            storeNotifications(updated);
            return updated;
          });

          setUnreadCount(c => c + 1);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentStoreId]);

  /* ---------------- STORAGE ---------------- */
  const storeNotifications = (list) =>
    localStorage.setItem("store-notifications", JSON.stringify(list));

  const getStoredNotifications = () =>
    JSON.parse(localStorage.getItem("store-notifications") || "[]");

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      await fetchRecentOrders();
    };
    init();

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  /* ---------------- OUTSIDE CLICK ---------------- */
  useEffect(() => {
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* ---------------- READ HANDLERS ---------------- */
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    storeNotifications(updated);
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setUnreadCount(c => Math.max(0, c - 1));
    storeNotifications(updated);
  };

const handleNotificationClick = (n) => {
  if (!n.read) markAsRead(n.id);
  
  // Check if we're already in a dashboard-like structure
  const currentPath = window.location.pathname;
  
  // If current path contains /store-owner or other parent route
  if (currentPath.includes('/store-owner')) {
    router.push(`/store-owner/store_orders?highlight=${n.orderId}`);
  } else {
    router.push(`/store_orders?highlight=${n.orderId}`);
  }
  
  setIsNotificationsOpen(false);
};

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem("store-notifications");
  };

  return (
    <header className="bg-white border-b sticky top-0 z-40">
      <div className="px-6 py-3 flex justify-between items-center pl-80">
        {/* <button onClick={onToggleSidebar} >
          {isSidebarOpen ? <X /> : <Menu />}
          adsad
        </button> */}

        <label className="text-2xl text-black">
          Shop: <div className="font-bold">{storeData?.name}</div>
        </label>

        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
              <Bell />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white border rounded-xl shadow">
                <div className="flex justify-between px-4 py-2 border-b">
                  <span className="font-semibold">Notifications</span>
                  <div className="space-x-2">
                    <button onClick={markAllAsRead}>Mark all</button>
                    <button onClick={clearAllNotifications}>Clear</button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="p-4 text-center text-gray-500">No notifications</p>
                  )}
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 cursor-pointer border-b ${
                        n.read ? "opacity-60" : "bg-blue-50"
                      }`}
                    >
                      <p className="font-medium">{n.title}</p>
                      <p className="text-sm text-gray-600">{n.message}</p>
                      <p className="text-xs text-gray-400">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-l pl-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
              {userData.first_name[0].toUpperCase()+ ""+ userData.last_name[0].toUpperCase() || "U"}
            </div>
            <span className="hidden sm:block">{userData.first_name+" "+ userData.last_name}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
