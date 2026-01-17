"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  /* ---------------- STATE ---------------- */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [userProfile, setUserProfile] = useState(null);
  const [store, setStore] = useState(null);

  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [startTime, setStartTime] = useState("");
  const [closeTime, setCloseTime] = useState("");

  const [storeLogoUrl, setStoreLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [licenseFile, setLicenseFile] = useState(null);
  const [licenseUrl, setLicenseUrl] = useState("");

  const [pharmacyLicenseFile, setPharmacyLicenseFile] = useState(null);
  const [pharmacyLicenseUrl, setPharmacyLicenseUrl] = useState("");

  const [modalImage, setModalImage] = useState(null);

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const userLS = localStorage.getItem("user_info");
    const storeLS = localStorage.getItem("store_info");

    if (userLS) {
      const user = JSON.parse(userLS);
      setUserProfile(user);
    }

    if (storeLS) {
      const storeData = JSON.parse(storeLS);
      setStore(storeData);

      setStoreName(storeData.name || "");
      setStoreAddress(storeData.address || "");
      setStorePhone(storeData.phone_number || "");
      setStartTime(storeData.start_time || "");
      setCloseTime(storeData.close_time || "");
      setStoreLogoUrl(storeData.logo_url || "");
      setLogoPreview(storeData.logo_url || "");
      setLicenseUrl(storeData.license_url || "");
      setPharmacyLicenseUrl(storeData.pharmacy_license || "");
    }

    setLoading(false);
  }, []);

  /* ---------------- FILE HANDLERS ---------------- */
  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      Swal.fire("Error", "Invalid image format", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire("Error", "Image must be under 5MB", "error");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  /* ---------------- UPLOADERS ---------------- */
  const uploadToStorage = async (file, folder) => {
    if (!file || !userProfile) return null;

    const ext = file.name.split(".").pop();
    const path = `${folder}/${userProfile.id}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("stores-logo")
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage
      .from("stores-logo")
      .getPublicUrl(path);

    return data.publicUrl;
  };

  /* ---------------- SAVE ---------------- */
const handleSave = async () => {
  if (!storeName.trim()) {
    Swal.fire("Error", "Store name is required", "error");
    return;
  }

  setSaving(true);
  console.log("🚀 Saving store...");

  try {
    let finalLogo = storeLogoUrl;
    let finalLicense = licenseUrl;
    let finalPharmacyLicense = pharmacyLicenseUrl;

    if (selectedFile) {
      console.log("📤 Uploading logo...");
      finalLogo = await uploadToStorage(selectedFile, "logos");
      console.log("✅ Logo uploaded:", finalLogo);
    }

    if (licenseFile) {
      console.log("📤 Uploading license...");
      finalLicense = await uploadToStorage(licenseFile, "licenses");
      console.log("✅ License uploaded:", finalLicense);
    }

    if (pharmacyLicenseFile) {
      console.log("📤 Uploading pharmacy license...");
      finalPharmacyLicense = await uploadToStorage(
        pharmacyLicenseFile,
        "pharmacy-licenses"
      );
      console.log("✅ Pharmacy license uploaded:", finalPharmacyLicense);
    }

    const payload = {
      name: storeName.trim(),
      address: storeAddress.trim(),
      phone_number: storePhone.trim(),
      start_time: startTime,
      close_time: closeTime,
      logo_url: finalLogo,
      license_url: finalLicense,
      pharmacy_license: finalPharmacyLicense,
    };

    console.log("📦 Payload:", payload);

    let savedStore;

    if (store?.id) {
      console.log("✏️ Updating store ID:", store.id);

      const { data, error } = await supabase
        .from("stores")
        .update(payload)
        .eq("id", store.id)
        .select()
        .single();

      if (error) {
        console.error("❌ Update error:", error);
        throw error;
      }

      savedStore = data;
    } else {
      console.log("🆕 Creating new store...");

      const { data, error } = await supabase
        .from("stores")
        .insert({ ...payload, user_id: userProfile.id })
        .select()
        .single();

      if (error) {
        console.error("❌ Insert error:", error);
        throw error;
      }

      savedStore = data;

      Swal.fire(
        "Store Created",
        "Your store has been created successfully. Please wait for admin validation.",
        "success"
      );
    }

    console.log("💾 Saved store:", savedStore);

    // SAVE TO LOCAL STORAGE
    localStorage.setItem("store_info", JSON.stringify(savedStore));
    setStore(savedStore);

    Swal.fire("Success", "Store settings saved", "success");
    router.refresh();
  } catch (err) {
    console.error("🔥 HANDLE SAVE ERROR:", err);
    Swal.fire("Error", err.message || "Something went wrong", "error");
  } finally {
    setSaving(false);
  }
};


  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 border-b-2 border-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-light">Store Settings</h1>

      <input
        className="w-full border p-2 rounded"
        placeholder="Store Name"
        value={storeName}
        onChange={(e) => setStoreName(e.target.value)}
      />

      <input
        className="w-full border p-2 rounded"
        placeholder="Address"
        value={storeAddress}
        onChange={(e) => setStoreAddress(e.target.value)}
      />

      <input
        className="w-full border p-2 rounded"
        placeholder="Phone Number"
        value={storePhone}
        onChange={(e) => setStorePhone(e.target.value)}
      />

      <input
        type="time"
        className="w-full border p-2 rounded"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
      />

      <input
        type="time"
        className="w-full border p-2 rounded"
        value={closeTime}
        onChange={(e) => setCloseTime(e.target.value)}
      />

      <input type="file" accept="image/*" onChange={handleLogoSelect} />
      {logoPreview && (
        <img
          src={logoPreview}
          className="max-h-24 cursor-pointer"
          onClick={() => setModalImage(logoPreview)}
          alt="Logo"
        />
      )}

      <input
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => setLicenseFile(e.target.files?.[0])}
      />

      <input
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => setPharmacyLicenseFile(e.target.files?.[0])}
      />

      <button
        onClick={handleSave}
        disabled={saving || uploading}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

      {modalImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setModalImage(null)}
        >
          <img src={modalImage} className="max-h-[90%]" alt="Preview" />
        </div>
      )}
    </div>
  );
}
