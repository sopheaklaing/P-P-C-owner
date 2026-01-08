"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const attempted = localStorage.getItem("google_login_attempt");

      //  User did NOT press "Google Login"
      if (!attempted) {
        router.replace("/login_registration");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/login_registration");
        return;
      }

      const user = session.user;

      // Check in custom users table
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      // ⚠️ New Google user → go register
      if (!existingUser) {
        router.replace(`/login_registration?email=${user.email}&method=google`);
      } 
      // ✔ Already registered → go home
      else {
        router.replace("/store-owner");
      }

      // Clear flag so refresh doesn't auto-login
      localStorage.removeItem("google_login_attempt");
    };

    checkUser();
  }, []);

  return (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3">
    <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    <p className="text-gray-600 text-sm">Checking your account...</p>
  </div>
);

}
