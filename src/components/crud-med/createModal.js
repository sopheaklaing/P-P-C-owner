"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProductForm from "./productForm";

export function CreateModal({ open, onClose, refresh }) {
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState(null);
  const [storeLoading, setStoreLoading] = useState(true);

  const userData = JSON.parse(localStorage.getItem("user_info"))


  const storeData = JSON.parse(localStorage.getItem("store_info"))
  
      

  const getUserStore = async () => {
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();

      if (userErr || !user) {
        console.error("No user found");
        return null;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (userError || !userData) {
        console.error("User not found in users table:", userError);
        return null;
      }

      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", userData.id)
        .maybeSingle();

      if (storeError) {
        console.error("Store error:", storeError);
        return null;
      }

      return storeData?.id || null;
    } catch (err) {
      console.error("getUserStore exception:", err);
      return null;
    }
  };

  useEffect(() => {
    const loadStoreId = async () => {
      setStoreLoading(true);
      const id = storeData.id
      setStoreId(id);
      setStoreLoading(false);
    };
    if (open) loadStoreId();
  }, [open]);

  const handleCreate = async (payload) => {
    try {
      setLoading(true);

      if (!storeId) {
        Swal.fire("Error", "No store found for this account. Please contact admin.", "error");
        return;
      }

      if (!payload.name || !payload.name.trim()) {
        Swal.fire("Error", "Product name is required", "error");
        return;
      }

      const { data: product, error: pErr } = await supabase
        .from("products")
        .insert({
          name: payload.name.trim(),
          description: payload.description?.trim() || "",
          category_id: payload.category_id,
          sub_category_id: payload.sub_category_id,
          image_url: payload.image_url,
          store_id: storeId,
        })
        .select()
        .single();

      if (pErr) {
        console.error("Product insert error:", pErr);
        throw new Error(`Product creation failed: ${pErr.message}`);
      }

      const productId = product.id;

      // Insert sale units
      if (payload.sale_units?.length > 0) {
        const validSaleUnits = payload.sale_units.filter(u =>
          u.unit_name && u.unit_name.trim() &&
          u.conversion_factor !== "" &&
          u.price !== "" &&
          u.stock_quantity !== ""
        );

        if (validSaleUnits.length > 0) {
          const saleUnitsToInsert = validSaleUnits.map(u => ({
            product_id: productId,
            unit_name: u.unit_name.trim(),
            conversion_factor: u.conversion_factor === "" ? 1 : Number(u.conversion_factor),
            price: u.price === "" ? 0 : Number(u.price),
            stock_quantity: u.stock_quantity === "" ? 0 : Number(u.stock_quantity),
            is_default_unit: u.is_default_unit || false,
          }));

          const { error: suErr } = await supabase.from("product_sale_units").insert(saleUnitsToInsert);
          if (suErr) console.warn("Failed to insert sale units:", suErr);
        }
      }

      // Insert sub images
      if (payload.sub_images?.length > 0) {
        const subImagesInsert = payload.sub_images
          .filter(img => img.image_url && img.image_url.trim())
          .map(img => ({ product_id: productId, image_url: img.image_url }));

        if (subImagesInsert.length > 0) {
          const { error: subErr } = await supabase.from("products_sub_images").insert(subImagesInsert);
          if (subErr) console.warn("Failed to insert sub images:", subErr);
        }
      }

      if (onClose) onClose();
      refresh();

      Swal.fire({
        title: "Success!",
        text: "Product created successfully",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Create error:", err);
      Swal.fire({
        title: "Error",
        text: err.message ? `Failed to create product. Error: ${err.message}` : "Failed to create product.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => !loading && onClose && onClose()}>
      <DialogContent className="flex flex-col min-w-300 max-w-screen max-h-[85vh] overflow-y-auto mt-15">
        <DialogHeader>
          <DialogTitle>Create Product</DialogTitle>
          {storeLoading && <p className="text-sm text-gray-600">Loading store information...</p>}
          {!storeLoading && !storeId && (
            <p className="text-sm text-red-600">⚠️ No store found. Please contact admin.</p>
          )}
        </DialogHeader>

        {storeLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="ml-2">Loading store information...</p>
          </div>
        ) : storeId ? (
          <ProductForm
            onSubmit={handleCreate}
            submitLabel={loading ? "Creating..." : "Create Product"}
            onCancel={() => onClose && onClose()}
            storeId={storeId}
          />
        ) : (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4">No store associated with your account.</p>
            <p className="text-sm text-gray-600 mb-4">Please register a store or contact the administrator.</p>
            <Button variant="outline" onClick={() => onClose && onClose()}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
