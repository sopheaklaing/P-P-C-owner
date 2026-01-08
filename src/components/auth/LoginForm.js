"use client";

import { useState } from "react";
// import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


export default function LoginForm() {
  const router = useRouter();

  const [mode, setMode] = useState("login"); // login | register
  const [step, setStep] = useState(1);       // 1 = enter phone, 2 = enter OTP
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState("");

  // Login states
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");


  // ---------------------
  // Send OTP
  // ---------------------
const sendOtp = async () => {
  setLoading(true);
  setMethod("otp");

  try {
    // ----------------------------------------
    // 1. Check if phone exists in users table
    // ----------------------------------------
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("phone_number", phone)
      .maybeSingle();

    // Phone NOT registered → go to registration
    if (!existingUser) {
      alert("This phone number is not registered. Please create an account first.");

      router.push(`/login_registration?phone=${phone}&method=otp`);
      setLoading(false);
      return;
    }

    // ----------------------------------------
    // 2. Phone exists → proceed to send OTP
    // ----------------------------------------
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();

    if (data.success) {
      alert("OTP sent successfully");
      setStep(2);
    } else {
      alert("Failed to send OTP");
    }
  } catch (error) {
    alert("Network error");
  }

  setLoading(false);
};


  // ---------------------
  // Verify OTP
  // ---------------------
  const verifyOtp = async () => {
    if (!otp) return alert("Missing", "Enter OTP", "warning");

    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Success", "Logged in!", "success");
        router.push("/home");
      } else {
        alert("Wrong OTP", "Try again", "error");
      }
    } catch {
      alert("Error", "Network error", "error");
    }
    setLoading(false);
  };

 



  // ---------------------
  // Google login placeholder
  // ---------------------
const handleGoogleLogin = async () => {
  setLoading(true);
  setMethod("gmail")

  try {
    // Mark that user intentionally clicked Google
    localStorage.setItem("google_login_attempt", "true");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) throw error;
  } catch (error) {
    alert("Login Failed: " + (error.message || "Something went wrong"));
    setLoading(false);
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
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <button
              onClick={sendOtp}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white py-2 rounded"
            >
              {loading && method=="otp"? "Sending..." : "Send OTP"}
            </button>

            <p className="text-center text-gray-500">or</p>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="bg-gray-200 hover:bg-gray-300 py-2 rounded"
            >
              {loading && method=="gmail"? "Redirecting..." : "Continue with Google"}
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
              className="bg-green-600 hover:bg-green-700 text-white py-2 rounded"
            >
              {loading && method=="otp"? "Verifying..." : "Verify OTP"}
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
