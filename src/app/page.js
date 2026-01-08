// import Image from "next/image";
// import Login_registration from "./(auth)/login_registration/page";
// export default function App() {
//   return (
//     <div >
//       <main >
//         <Login_registration/>
//       </main>
//     </div>
//   );
// }
// src/app/page.js
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login_registration");
}
