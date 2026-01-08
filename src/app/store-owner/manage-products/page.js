"use client";

import React, { useState, useEffect } from "react";
import { CreateModal } from "@/components/crud-med/createModal";
import { DeleteModal } from "@/components/crud-med/deleteModal";
import { EditModal } from "@/components/crud-med/editModal";


import StatisticHeader from "@/components/crud-med/statisticHeader";
import QuickStats from "@/components/crud-med/statCards";
import ProductsList from "@/components/crud-med/ProductsList";

import Filters from "@/components/crud-med/filter";

import { supabase } from "@/lib/supabase";
export default function MedicationsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [mainCategoryFilter, setMainCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [openDelDialog, setOpenDelDialog] = useState(false);

  // Categories
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [filtredLength, setFiltredLength] = useState(0);

  const storeData = JSON.parse(localStorage.getItem("store_info"));
  const storeid= storeData.id

  const handleRefresh = async () => {
    setLoading(true);

    try {
      // Fetch main categories
      const { data: mainCats } = await supabase
        .from("main_categories")
        .select("*");
      setMainCategories(mainCats || []);

      // Fetch subcategories
      const { data: subCats } = await supabase
        .from("sub_categories")
        .select("*");
      setSubCategories(subCats || []);

      // Fetch products + sale units + sub images
      const { data: productsData, error: productError } = await supabase.from(
        "products"
      ).select(`
      id,
      name,
      store_id,
      description,
      image_url,
      main_categories (id, name),
      sub_categories (id,name),
      product_sale_units (*),
      products_sub_images (*)
    `).eq("store_id", storeid).eq("visible", true);

      if (productError) {
        setError("Failed to fetch product data");
        setProducts([]);
      } else {
        setProducts(productsData || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }

    setLoading(false);
  };

  const handleModalClose = () => {
    
    setOpenDialog(false)
    setOpenDelDialog(false)
    setIsCreateModalOpen(false);
    setEditingProduct(null);
    setDeletingProduct(null);
    //handleRefresh();
  };

  const handleOpenDialog=()=>{
    setOpenDialog(true)
  }

    const handleOpenDelDialog=()=>{
    setOpenDelDialog(true)
  }

  useEffect(() => {
    handleRefresh();
  }, []);

  useEffect(() => {
   console.log("filter:", [searchTerm,mainCategoryFilter,subCategoryFilter])
  }, [searchTerm,mainCategoryFilter,subCategoryFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setMainCategoryFilter("");
    setSubCategoryFilter("");
    setShowLowStock(false);
    setShowExpiringSoon(false);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <StatisticHeader
        loading={loading}
        onRefresh={handleRefresh}
        onAdd={ handleOpenDialog}
        
      />

      <QuickStats products={products} filtredLength={filtredLength} />

      <Filters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}

        mainCategoryFilter={mainCategoryFilter}
        setMainCategoryFilter={setMainCategoryFilter}

        subCategoryFilter={subCategoryFilter}
        setSubCategoryFilter={setSubCategoryFilter}
        
        mainCategories={mainCategories}
        subCategories={subCategories}
        clearFilters={clearFilters}
      />

      <ProductsList
        products={products}
        loading={loading}
        filters={{
          searchTerm,
          mainCategoryFilter,
          subCategoryFilter,
        }}
        handleOpenDialog = {handleOpenDialog}
        handleOpenDelDialog={handleOpenDelDialog}
        onEdit={setEditingProduct}
        onDelete={setDeletingProduct}
        setFiltredLength={setFiltredLength}
      />

      {/* Modals */}
      { <CreateModal open={openDialog} onClose={handleModalClose} refresh={handleRefresh}/>}
      {editingProduct && (
        <EditModal editing_product={editingProduct} openDialog={openDialog}  onClose={handleModalClose} refresh={handleRefresh}  />
      )}
      {deletingProduct && (
        <DeleteModal openDialog={openDelDialog}  data={deletingProduct} close={handleModalClose} refresh={handleRefresh} />
      )}
    </div>
  );
}
