"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Swal from "sweetalert2";

function ProductForm({
  initialData = null,
  onSubmit,
  submitLabel = "Save Product",
  categories: categoriesProp = null,
  subCategories: subCategoriesProp = null,
  onCancel,
  storeId,
}) {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [mainCategory, setMainCategory] = useState(
    initialData?.category_id ? String(initialData.category_id) : ""
  );
  const [subCategory, setSubCategory] = useState(
    initialData?.sub_category_id ? String(initialData.sub_category_id) : ""
  );

  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(
    initialData?.image_url || null
  );

  const [subImagePreviews, setSubImagePreviews] = useState(
    initialData?.sub_images?.map((img) => ({
      id: img.id ?? null,
      image_url: img.image_url,
    })) || []
  );

  const [saleUnits, setSaleUnits] = useState(
    initialData?.sale_units?.length
      ? initialData.sale_units.map((u) => ({
          id: u.id ?? null,
          unit_name: u.unit_name || "",
          conversion_factor: u.conversion_factor ?? "1",
          price: u.price ?? "0",
          stock_quantity: u.stock_quantity ?? "0",
          is_default_unit: !!u.is_default_unit,
        }))
      : [
          {
            id: null,
            unit_name: "unit",
            conversion_factor: "1",
            price: "0",
            stock_quantity: "0",
            is_default_unit: true,
          },
        ]
  );

  const [categories, setCategories] = useState(categoriesProp || []);
  const [subCategories, setSubCategories] = useState(subCategoriesProp || []);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!categoriesProp) {
      (async () => {
        const { data, error } = await supabase
          .from("main_categories")
          .select("id,name")
          .order("name", { ascending: true });
        if (!error && data) setCategories(data);
      })();
    }
    if (!subCategoriesProp) {
      (async () => {
        const { data, error } = await supabase
          .from("sub_categories")
          .select("id,main_category_id,name")
          .order("name", { ascending: true });
        if (!error && data) setSubCategories(data);
      })();
    }
  }, [categoriesProp, subCategoriesProp]);

  const addSaleUnit = () => {
    setSaleUnits((s) => [
      ...s,
      {
        id: null,
        unit_name: "",
        conversion_factor: "1",
        price: "0",
        stock_quantity: "0",
        is_default_unit: false,
      },
    ]);
  };

  const updateSaleUnit = (idx, field, value) => {
    setSaleUnits((s) => {
      const copy = [...s];
      copy[idx] = {
        ...copy[idx],
        [field]:
          value ||
          (field === "conversion_factor"
            ? "1"
            : field === "price"
            ? "0"
            : field === "stock_quantity"
            ? "0"
            : ""),
      };
      return copy;
    });
  };

  const removeSaleUnit = (idx) => {
    if (saleUnits.length <= 1) {
      Swal.fire("Error", "At least one sale unit is required", "error");
      return;
    }
    setSaleUnits((s) => s.filter((_, i) => i !== idx));
  };

  const setAsDefaultUnit = (idx) => {
    setSaleUnits((s) =>
      s.map((u, i) => ({ ...u, is_default_unit: i === idx }))
    );
  };

  const handleMainImageChange = (file) => {
    if (!file) return;
    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
  };

  const handleAddSubImages = (filesArray) => {
    if (!filesArray?.length) return;

    const newFiles = Array.from(filesArray);

    const newPreviews = newFiles.map((file) => {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      return {
        id: null,
        file,
        fileName,
        image_url: URL.createObjectURL(file),
        finalPath: `products_sub_images/${fileName}`,
      };
    });

    setSubImagePreviews((prev) => [...prev, ...newPreviews]);

    // ✅ Reset the input so same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeSubImageAt = (idx) => {
    setSubImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadFileToBucket = async (file, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from("products_sub_images")
        .upload(fileName, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });
      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("products_sub_images")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (err) {
      console.error("Upload error", err);
      throw err;
    }
  };

  const makeFilename = (origName) => {
    const ext = origName.split(".").pop() || "png";
    return `${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
  };

  const prepareUploadedImages = async () => {
    const folder = `${Date.now()}`;

    let mainUrl = initialData?.image_url || null;
    if (mainImageFile) {
      const name = makeFilename(mainImageFile.name);
      const path = `main/${folder}/${name}`;
      mainUrl = await uploadFileToBucket(mainImageFile, path);
    }

    const uploadedSubUrls = [];

    for (const img of subImagePreviews) {
      if (img.id === null && img.file && img.fileName) {
        const url = await uploadFileToBucket(img.file, img.fileName);
        uploadedSubUrls.push({ id: null, image_url: url });
      }
    }

    const finalSubImages = [
      ...subImagePreviews.filter((img) => img.id !== null),
      ...uploadedSubUrls,
    ];

    return { mainUrl, subImages: finalSubImages };
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (storeId === null) {
      Swal.fire(
        "Error",
        "Store information is missing. Please contact admin.",
        "error"
      );
      return;
    }

    if (!name.trim()) {
      Swal.fire("Error", "Product name is required", "error");
      return;
    }

    const validSaleUnits = saleUnits.filter(
      (u) =>
        u.unit_name &&
        u.unit_name.trim() &&
        u.conversion_factor !== "" &&
        u.price !== "" &&
        u.stock_quantity !== ""
    );

    if (validSaleUnits.length === 0) {
      Swal.fire("Error", "At least one valid sale unit is required", "error");
      return;
    }

    const hasDefaultUnit = validSaleUnits.some((u) => u.is_default_unit);
    const finalSaleUnits = hasDefaultUnit
      ? validSaleUnits
      : validSaleUnits.map((u, i) => ({ ...u, is_default_unit: i === 0 }));

    setLoading(true);

    try {
      const { mainUrl, subImages } = await prepareUploadedImages();

      const payload = {
        name: name.trim(),
        description: description.trim(),
        category_id: mainCategory ? Number(mainCategory) : null,
        sub_category_id: subCategory ? Number(subCategory) : null,
        image_url: mainUrl,
        sub_images: subImages,
        sale_units: finalSaleUnits.map((u) => ({
          id: u.id,
          unit_name: u.unit_name.trim(),
          conversion_factor: u.conversion_factor,
          price: u.price,
          stock_quantity: u.stock_quantity,
          is_default_unit: u.is_default_unit,
        })),
        store_id: storeId,
      };

      await onSubmit(payload);
    } catch (err) {
      console.error("Failed to submit product form", err);
      Swal.fire(
        "Error",
        "Failed to submit form. Please check the console for details.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-4 md:p-6 rounded-lg shadow-sm border"
    >
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Product Name *</label>
            {/* <Input placeholder="Enter product name" value={name} onChange={(e) => setName(e.target.value)} required /> */}
            <Textarea
              placeholder="Enter product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              rows={2}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Category *</label>
            <Select
              onValueChange={(v) => setMainCategory(v)}
              value={mainCategory || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Subcategory</label>
            <Select
              onValueChange={(v) => setSubCategory(v)}
              value={subCategory || undefined}
              disabled={!mainCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Subcategory" />
              </SelectTrigger>
              <SelectContent>
                {subCategories
                  .filter(
                    (s) => String(s.main_category_id) === String(mainCategory)
                  )
                  .map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            placeholder="Short product description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Images</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Main Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleMainImageChange(e.target.files?.[0] || null)
              }
              className="block w-full text-sm file:mr-3 file:px-4 file:py-2 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            {mainImagePreview && (
              <div className="w-24 h-24 sm:w-28 sm:h-28 border rounded mt-2">
                <Image
                  src={mainImagePreview}
                  alt="main-preview"
                  width={200}
                  height={200}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sub Images</label>
            <input
              ref={fileInputRef} // add ref
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleAddSubImages(e.target.files)}
              className="block w-full text-sm file:mr-3 file:px-4 file:py-2 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            <div className="flex flex-wrap gap-3 mt-2">
              {subImagePreviews.map((p, i) => (
                <div
                  key={i}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 border rounded overflow-hidden"
                >
                  <Image
                    src={p.image_url}
                    alt={`sub-${i}`}
                    width={300}
                    height={300}
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    onClick={() => removeSubImageAt(i)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sale Units */}
      <div className="space-y-3 flex flex-col">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-lg font-semibold">Sale Units *</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSaleUnit}
          >
            + Add Unit
          </Button>
        </div>

        <div className="space-y-3">
          {saleUnits.map((u, i) => (
            <div
              key={i}
              className="grid grid-cols-1 gap-3 rounded border bg-gray-50 p-3 sm:grid-cols-6 sm:items-end"
            >
              {/* Unit name */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Unit name
                </label>
                <Input
                  placeholder="e.g., tablet"
                  value={u.unit_name}
                  onChange={(e) =>
                    updateSaleUnit(i, "unit_name", e.target.value)
                  }
                  required
                />
              </div>

              {/* Conversion factor */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Conversion
                </label>
                <Input
                  type="number"
                  placeholder="1"
                  value={u.conversion_factor}
                  onChange={(e) =>
                    updateSaleUnit(i, "conversion_factor", e.target.value)
                  }
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Price
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={u.price}
                  onChange={(e) => updateSaleUnit(i, "price", e.target.value)}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              {/* Stock */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Stock
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={u.stock_quantity}
                  onChange={(e) =>
                    updateSaleUnit(i, "stock_quantity", e.target.value)
                  }
                  min="0"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant={u.is_default_unit ? "default" : "outline"}
                  onClick={() => setAsDefaultUnit(i)}
                >
                  Default
                </Button>

                {saleUnits.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeSaleUnit(i)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500">
          * At least one sale unit is required
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
        <Button
          variant="ghost"
          type="button"
          className="w-full sm:w-auto"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={loading || storeId === null}
          className="w-full sm:w-auto"
        >
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
