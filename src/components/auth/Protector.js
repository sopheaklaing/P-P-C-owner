"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";

export default function Protected({ children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      // 1. Check session
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.replace("/login_registration");
        return;
      }

      const authUser = sessionData.session.user;

      // 2. Get user from custom users table
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", authUser.email)
        .maybeSingle();

      if (userError || !userRecord) {
        router.replace("/login_registration");
        return;
      }

      // 3. Role check
      if (userRecord.role !== "owner") {
        Swal.fire({
          title: "Account role mismatch",
          text: "Your account is not an owner. Redirecting to login.",
          icon: "error",
          confirmButtonText: "OK",
        });
        router.replace("/login_registration");
        return;
      }

      // 4. Fetch store by user_id
      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", userRecord.id)
        .maybeSingle();

      if (storeError) {
        console.error(storeError);
        Swal.fire("Error", "Failed to load store data", "error");
        return;
      }

      // 5. Save to localStorage
      localStorage.setItem(
        "user_info",
        JSON.stringify({
          id: userRecord.id,
          email: userRecord.email,
          first_name: userRecord.first_name,
          last_name: userRecord.last_name,
          phone_number: userRecord.phone_number,
          role: userRecord.role,
        })
      );

      if (storeData) {
        localStorage.setItem(
          "store_info",
          JSON.stringify({
            id: storeData.id,
            name: storeData.name,
            slug: storeData.slug,
            phone_number: storeData.phone_number,
            address: storeData.address,
            logo_url: storeData.logo_url,
            license_url: storeData.license_url,
            start_time: storeData.start_time,
            close_time: storeData.close_time,
            validated: storeData.validated,
          })
        );
      } else {
        // Owner without store yet
        localStorage.removeItem("store_info");
      }

      // 6. Allow access
      setAllowed(true);
    };

    checkUser();
  }, [router]);

  if (!allowed) return null;
  return <>{children}</>;
}
