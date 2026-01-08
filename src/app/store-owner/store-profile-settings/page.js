"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [store, setStore] = useState(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeLogoUrl, setStoreLogoUrl] = useState("");

  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [storageReady] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storePhone, setStorePhone] = useState("");
  const [startTime, setStartTime] = useState("");
  const [closeTime, setCloseTime] = useState("");

  const [licenseFile, setLicenseFile] = useState(null);
  const [licenseUrl, setLicenseUrl] = useState("");

  const [pharmacyLicenseFile, setPharmacyLicenseFile] = useState(null);
  const [pharmacyLicenseUrl, setPharmacyLicenseUrl] = useState("");
  

  const [modalImage, setModalImage] = useState(null);

  const router = useRouter();

  const userData =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user_info"))
      : null;

  const storeDataFromLS =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("store_info"))
      : null;

  useEffect(() => {
    if (!userData) {
      setLoading(false);
      return;
    }

    setUserProfile(userData);
    setFirstName(userData.first_name || "");
    setLastName(userData.last_name || "");

    if (storeDataFromLS) {
      setStore(storeDataFromLS);
      setStoreName(storeDataFromLS.name || "");
      setStoreAddress(storeDataFromLS.address || "");
      setStoreLogoUrl(storeDataFromLS.logo_url || "");
      setLogoPreview(storeDataFromLS.logo_url || "");
      setStorePhone(storeDataFromLS.phone_number || "");
      setStartTime(storeDataFromLS.start_time || "");
      setCloseTime(storeDataFromLS.close_time || "");
      setLicenseUrl(storeDataFromLS.license_url || "");
      setPharmacyLicenseUrl(storeDataFromLS.pharmacy_license || "");
    }

    setLoading(false);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!validTypes.includes(file.type)) {
      Swal.fire("Error", "Invalid image format.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire("Error", "File must be under 5MB.", "error");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadLogo = async () => {
    if (!selectedFile || !userProfile) return null;

    setUploading(true);
    try {
      const ext = selectedFile.name.split(".").pop();
      const filePath = `logos/${userProfile.id}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("stores-logo")
        .upload(filePath, selectedFile, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from("stores-logo")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      Swal.fire("Upload Failed", error.message, "error");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadLicense = async () => {
    if (!licenseFile || !userProfile) return null;

    try {
      const ext = licenseFile.name.split(".").pop();
      const path = `licenses/${userProfile.id}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("stores-logo")
        .upload(path, licenseFile, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage.from("stores-logo").getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      Swal.fire("Upload Failed", error.message, "error");
      return null;
    }
  };

  const uploadPharmacyLicense = async () => {
    if (!pharmacyLicenseFile || !userProfile) return null;

    try {
      const ext = pharmacyLicenseFile.name.split(".").pop();
      const path = `pharmacy-licenses/${userProfile.id}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("stores-logo")
        .upload(path, pharmacyLicenseFile, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage.from("stores-logo").getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      Swal.fire("Upload Failed", error.message, "error");
      return null;
    }
  };

  const handleSave = async () => {
    if (!userProfile || !storeName.trim()) {
      Swal.fire("Error", "Store name is required.", "error");
      return;
    }

    setSaving(true);

    try {
      let finalLogoUrl = storeLogoUrl;
      let finalLicenseUrl = licenseUrl;
      let finalPharmacyLicenseUrl = pharmacyLicenseUrl;

      if (selectedFile) {
        const url = await uploadLogo();
        if (url) finalLogoUrl = url;
      }

      if (licenseFile) {
        const url = await uploadLicense();
        if (url) finalLicenseUrl = url;
      }

      if (pharmacyLicenseFile) {
  const url = await uploadPharmacyLicense();
  if (url) finalPharmacyLicenseUrl = url;
}

      const storePayload = {
        name: storeName.trim(),
        address: storeAddress.trim(),
        logo_url: finalLogoUrl,
        phone_number: storePhone.trim(),
        start_time: startTime,
        close_time: closeTime,
        license_url: finalLicenseUrl,
        pharmacy_license: finalPharmacyLicenseUrl,
      };

      let updatedStore;

      if (store) {
        const { data } = await supabase
          .from("stores")
          .update(storePayload)
          .eq("id", store.id)
          .select()
          .single();

        updatedStore = data;
      } else {
        const { data } = await supabase
          .from("stores")
          .insert({ ...storePayload, user_id: userProfile.id })
          .select()
          .single();

        updatedStore = data;
      }

      // ✅ SAVE TO LOCAL STORAGE
      localStorage.setItem("store_info", JSON.stringify(updatedStore));

      // ✅ UPDATE STATE (instant UI update)
      setStore(updatedStore);

      Swal.fire("Success", "Settings updated successfully.", "success");

      // 🔁 Optional: full refresh
      // window.location.reload();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setSaving(false);
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-light">Store Settings</h1>

      {/* Store Name */}
      <div className="flex items-center space-x-4">
        <label className="w-32 text-gray-700">Store Name:</label>
        <input
          className="flex-1 border p-2 rounded"
          placeholder="Store Name"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
        />
      </div>

      {/* Address */}
      <div className="flex items-center space-x-4">
        <label className="w-32 text-gray-700">Address:</label>
        <input
          className="flex-1 border p-2 rounded"
          placeholder="Store Address"
          value={storeAddress}
          onChange={(e) => setStoreAddress(e.target.value)}
        />
      </div>

      {/* Phone */}
      <div className="flex items-center space-x-4">
        <label className="w-32 text-gray-700">Phone Number:</label>
        <input
          className="flex-1 border p-2 rounded"
          placeholder="Phone Number"
          value={storePhone}
          onChange={(e) => setStorePhone(e.target.value)}
        />
      </div>

      {/* Start & Close Time */}
      <div className="flex items-center space-x-4">
        <label className="w-32 text-gray-700">Start Time:</label>
        <input
          className="flex-1 border p-2 rounded"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>
      <div className="flex items-center space-x-4">
        <label className="w-32 text-gray-700">Close Time:</label>
        <input
          className="flex-1 border p-2 rounded"
          type="time"
          value={closeTime}
          onChange={(e) => setCloseTime(e.target.value)}
        />
      </div>

      {/* Store Logo */}
      <div className="flex items-center space-x-4">
        <label className="w-32 text-gray-700">Store Logo:</label>
        <div className="flex-1">
          <input type="file" accept="image/*" onChange={handleFileSelect} />
          {logoPreview ? (
            <img
              src={logoPreview}
              className="mt-2 max-h-24 object-contain cursor-pointer"
              onClick={() => setModalImage(logoPreview)}
              alt="Store Logo"
            />
          ) : (
            <p className="mt-2 text-sm text-gray-500">No logo uploaded</p>
          )}
        </div>
      </div>

      {/* License */}
      <div className="flex items-center space-x-4">
        <label className="w-32 text-gray-700">Business License:</label>
        <div className="flex-1">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setLicenseFile(e.target.files?.[0])}
          />
          {licenseUrl ? (
            <a
              href={licenseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm block mt-1"
            >
              View current license
            </a>
          ) : (
            <p className="mt-2 text-sm text-gray-500">No license uploaded</p>
          )}
        </div>
      </div>

      {/* Pharmacy License */}
      <div className="flex items-center space-x-4">
        <label className="w-32 text-gray-700">Pharmacy License:</label>
        <div className="flex-1">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setPharmacyLicenseFile(e.target.files?.[0])}
          />
          {pharmacyLicenseUrl ? (
            <a
              href={pharmacyLicenseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm block mt-1"
            >
              View current pharmacy license
            </a>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              No pharmacy license uploaded
            </p>
          )}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || uploading}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        {saving || uploading ? "Saving..." : "Save Changes"}
      </button>

      {/* Modal for image preview */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setModalImage(null)}
        >
          <img
            src={modalImage}
            className="max-h-[90%] max-w-[90%] object-contain rounded shadow-lg"
            alt="Preview"
          />
        </div>
      )}
    </div>
  );
}
