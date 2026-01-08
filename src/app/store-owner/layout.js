"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


import Sidebar from "@/components/layout/sidebar";
import Protected from "@/components/auth/Protector";
import Header from "@/components/layout/navbar";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <Protected>
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        {/* Main Layout */}
        <div className="flex">
          {/* Sidebar */}
          <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

          {/* Main Content */}
          <main
            className={`
            flex-1 transition-all duration-300 ease-in-out
            min-h-[calc(100vh-4rem)]
            ${isSidebarOpen ? "lg:ml-64" : "lg:ml-20"}
            lg:p-6
          `}
          >
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </Protected>
  );
}
