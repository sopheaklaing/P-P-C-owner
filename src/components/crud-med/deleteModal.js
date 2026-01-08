"use client";

import React, { useState } from "react";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DeleteModal({ data, close, refresh ,openDialog}) {
  const [loading, setLoading] = useState(false);

  const extractStoragePath = (url) => {
    if (!url) return null;
    const parts = url.split("/public/");
    return parts.length === 2 ? parts[1] : null;
  };

  const deleteImagesFromStorage = async (paths) => {
    if (!paths.length) return;
    await supabase.storage.from("products_sub_images").remove(paths);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);

      const productId = data?.id;
      if (!productId) return;

      const { error } = await supabase
        .from("products")
        .update({ visible: false })
        .eq("id", productId);

      if (error) throw error;

      refresh();
      close?.();

      Swal.fire({
        title: "Deleted!",
        text: "Product has been hidden successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete product!", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={() => !loading && close?.()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to delete:
          <br />
          <span className="font-semibold text-red-600">{data?.name}</span>?
          <br />
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={close} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
