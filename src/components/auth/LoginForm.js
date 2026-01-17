"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { useEffect } from "react";
import Swal from "sweetalert2";
import { FcGoogle } from "react-icons/fc";
export default function LoginForm() {
  const router = useRouter();

  const [mode, setMode] = useState("login"); // login | register
  const [step, setStep] = useState(1); // 1 = enter phone, 2 = enter OTP
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState(null);

  // Login states
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  // ---------------------
  // Send OTP
  // ---------------------
  const sendOtp = async () => {
    if (loading) return;

    setLoading(true);
    setMethod("otp");

    try {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("phone_number", phone)
        .maybeSingle();

      if (!existingUser) {
        Swal.fire({
          title: "This phone number is not registered!",
          text: "Please create an account first!",
          icon: "error",
        });

        router.push(" /login_registration?phone=${phone}&method=otp" );
        return;
      }

      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire("OTP sent!", "Check your SMS", "success");
        setStep(2);
      } else {
        Swal.fire("Failed!", "Failed to send OTP", "error");
      }
    } catch {
      Swal.fire("Network error!", "Check your internet", "error");
    } finally {
      setLoading(false);
      setMethod(null);
    }
  };

  // ---------------------
  // Verify OTP
  // ---------------------
  const verifyOtp = async () => {
    if (!otp)
      return Swal.fire({
        title: "Missing OTP!",
        text: "Be sure to input the OTP",
        icon: "error",
        confirmButtonText: "OK",
      });

    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          title: "Login Successful!",
          text: "Took me 2 days to do this, fu twiolio",
          icon: "success",
          confirmButtonText: "OK",
        });
        router.push("/home");
      } else {
        //alert("Wrong OTP", "Try again", "error");
        Swal.fire({
          title: "Wrong OTP!",
          text: "Try again",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch {
      //alert("Error", "Network error", "error");
      Swal.fire({
        title: "Network error!",
        text: "You may need to check your internet connection",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
    setLoading(false);
  };

  // ---------------------
  // Google login placeholder
  // ---------------------
  const handleGoogleLogin = async () => {
    if (loading) return;

    setLoading(true);
    setMethod("gmail");

    try {
      localStorage.setItem("google_login_attempt", "true");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) throw error;
    } catch {
      Swal.fire("Login Failed!", "Something went wrong", "error");
      setLoading(false);
      setMethod(null);
    }
  };

  return (
    <div className="flex items-center justify-center  bg-gray-100">
      <div className="bg-white w-96 shadow-xl rounded-xl p-6">
        <h1 className="text-2xl font-bold text-center mb-4">
          {mode === "login" ? "Login" : "Register"}
        </h1>
        {/* ----------------------
           LOGIN PAGE (STEP 1)
        ---------------------- */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <input
              className="border p-2 rounded"
              placeholder="+85512345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <button
              onClick={sendOtp}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white py-2 border rounded-lg font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && method === "otp" ? "Sending..." : "Send OTP"}
            </button>

            <p className="text-center text-gray-500">or</p>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="
    flex items-center justify-center gap-3
    w-full py-2.5 px-4 rounded-lg
    bg-white text-gray-700 font-medium
    border border-gray-300
    shadow-sm
    hover:bg-gray-50 hover:shadow
    active:bg-gray-100
    disabled:opacity-60 disabled:cursor-not-allowed
    transition-all duration-200
  "
            >
              {loading && method === "gmail" ? (
                "Redirecting…"
              ) : (
                <>
                  <FcGoogle />
                  Continue with Google
                </>
              )}
            </button>
          </div>
        )}

        {/* ----------------------
           LOGIN PAGE (STEP 2 - OTP)
        ---------------------- */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <input
              className="border p-2 rounded"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button
              onClick={verifyOtp}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white py-2 rounded cursor-pointer font-semibold"
            >
              {loading && method == "otp" ? "Verifying..." : "Verify OTP"}
            </button>

            <p
              className="text-center text-blue-600 cursor-pointer mt-3"
              onClick={() => {
                setStep(1);
                setOtp("");
              }}
            >
              Change phone number
            </p>
          </div>
        )}
      </div>
    </div>
  );
}