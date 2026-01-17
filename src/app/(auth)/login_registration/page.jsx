
"use client"

import { useState , useEffect} from "react";
import SignUpForm from "@/components/auth/SignUpForm";
import LoginForm from "@/components/auth/LoginForm";
import { useSearchParams } from "next/navigation";


const Login_registration=()=>{
    const searchParams = useSearchParams();
    const [tab, toggleTab] = useState("login")

    //callback:  router.replace("/login_registration?tab=signUp&method=google&step=3");
   useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "signUp") {
      toggleTab("signUp");
    }
  }, [searchParams]);

    return (
            <div className="fixed z-502 top-0 bg-amber-50 w-screen h-screen flex justify-center items-center  ">
                <div className="input-box z-2 border border-gray-200 rounded-2xl shadow-lg flex flex-col p-6 space-y-4
                     bg-white min-w-100 transform transition-transform duration-500 -translate-y-25">
                    <div>
                        <button className={`outline-0 text-xl tracking-tight ${tab ==="login"?"font-semibold text-[#107A1D] border-b-2 border-[#107A1D]": "font-normal text-gray-900 border-none"}  transition-colors duration-300`} onClick={()=>toggleTab("login")} >Login</button>
                        <span className="mx-6">or</span>
                        <button className={`outline-0 text-xl  tracking-tight ${tab ==="signUp"?"font-semibold text-[#107A1D]  border-b-2 border-[#107A1D]": "font-normal text-gray-900 border-none"} transition-colors duration-300`} onClick={()=>toggleTab("signUp")}>Sign-up</button>
                    </div>

                    {tab ==="login"? <LoginForm/>: <SignUpForm/>}
                    
                
                </div>
            </div>

        
    )
}

export default Login_registration;