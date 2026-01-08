"use client";

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductForm from "./productForm";

export function EditModal({ editing_product,openDialog, onClose, refresh }) {
  const [loading, setLoading] = useState(true);
   const [product, setProduct] = useState(null);
  const [saleUnits, setSaleUnits] = useState([]);
  const [subImages, setSubImages] = useState([]);
  const [productID, setProductID] = useState(editing_product.id);


  useEffect(() => {
    const load = async () => {
      setLoading(true);

      setProduct(editing_product);
      setSaleUnits(editing_product.product_sale_units);
      setSubImages(editing_product.products_sub_images || []);

      setLoading(false);
    };
    load();
  }, [product]);

  const handleUpdate = async (payload) => {
    try {
      setLoading(true);

      // 1. Update product main info
      const { error: pErr } = await supabase
        .from("products")
        .update({
          name: payload.name,
          description: payload.description,
          category_id: payload.category_id,
          sub_category_id: payload.sub_category_id,
          image_url: payload.image_url,
        })
        .eq("id", productID);

      if (pErr) {
        console.error("Product update error:", pErr);
        throw pErr;
      }

  
      // 2. Update sale units
      for (const u of payload.sale_units) {
        if (!u.id) {
          // Insert new sale unit
          const { error: insertErr } = await supabase
            .from("product_sale_units")
            .insert({
              product_id: productID,
              unit_name: u.unit_name,
              conversion_factor: u.conversion_factor === "" ? null : Number(u.conversion_factor),
              price: u.price === "" ? 0 : Number(u.price),
              stock_quantity: u.stock_quantity === "" ? 0 : Number(u.stock_quantity),
              is_default_unit: u.is_default_unit,
            });
          if (insertErr) console.error("Insert sale unit error:", insertErr);
          continue;
        }

        // Update existing sale unit
        const { error: updateErr } = await supabase
          .from("product_sale_units")
          .update({
            unit_name: u.unit_name,
            conversion_factor: u.conversion_factor === "" ? null : Number(u.conversion_factor),
            price: u.price === "" ? 0 : Number(u.price),
            stock_quantity: u.stock_quantity === "" ? 0 : Number(u.stock_quantity),
            is_default_unit: u.is_default_unit,
          })
          .eq("id", u.id);

        if (updateErr) console.error("Update sale unit error:", updateErr);
      }

      // 3. Delete removed sale units
      const incomingIds = payload.sale_units.map((u) => u.id).filter(Boolean);
      const existingIds = saleUnits.map((u) => u.id).filter(Boolean);
      const toDelete = existingIds.filter((id) => !incomingIds.includes(id));
      if (toDelete.length > 0) {
        await supabase.from("product_sale_units").delete().in("id", toDelete);
      }

      // 4. Handle sub images
      const existingImgIds = subImages.map((img) => img.id).filter(Boolean);
      const incomingImgIds = payload.sub_images.map((img) => img.id).filter(Boolean);
      const toDeleteImgs = existingImgIds.filter((id) => !incomingImgIds.includes(id));
      if (toDeleteImgs.length > 0) {
        await supabase.from("products_sub_images").delete().in("id", toDeleteImgs);
      }

      const newImages = payload.sub_images.filter((img) => !img.id);
      if (newImages.length > 0) {
        await supabase.from("products_sub_images").insert(
          newImages.map((img) => ({
            product_id: productID,
            image_url: img.image_url,
          }))
        );
      }

      onClose();
      refresh();

      Swal.fire({
        title: "Success!",
        text: "Product updated successfully",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      onClose();
      console.error(err);
      Swal.fire("Error", "Failed to update product", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !product) {
    return (
      <Dialog open={openDialog} onOpenChange={() => close?.()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="ml-2">Loading product data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={openDialog} onOpenChange={() => !loading && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="flex flex-col mt-15 min-w-250 max-h-[75vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <label>{product.id}</label>
        </DialogHeader>

        <ProductForm
          initialData={{
            ...product,
            sale_units: saleUnits,
            sub_images: subImages,
          }}
          onSubmit={handleUpdate}
          submitLabel={loading ? "Saving..." : "Save Changes"}
          onCancel={() => onClose()}
          storeId={product.store_id}
        />
      </DialogContent>
    </Dialog>
  );
}
