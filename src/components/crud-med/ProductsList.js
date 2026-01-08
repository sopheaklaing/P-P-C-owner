
import { ShoppingCart } from "lucide-react";
import ProductRow from "./productRow";
import { useEffect } from "react";


// filters={{
//           searchTerm,
//           mainCategoryFilter,
//           subCategoryFilter,
//         }}

//  const { data: productsData, error: productError } = await supabase.from(
//         "products"
//       ).select(`
//       id,
//       name,
//       store_id,
//       description,
//       image_url,
//       main_categories (id, name),
//       sub_categories (id,name),
//       product_sale_units (*),
//       products_sub_images (*)
//     `).eq("store_id", storeid);

export default function ProductsList({
  products,
  loading,
  filters,
  onEdit,
  onDelete,
  handleOpenDialog,
  handleOpenDelDialog,
  setFiltredLength
}) {

const filteredProducts = products.filter((product) => {
  // Filter by main category if selected
  if (filters.mainCategoryFilter) {
    if (product.main_categories?.id !== Number(filters.mainCategoryFilter)) {
      return false;
    }
  }

  // Filter by sub category if selected
  if (filters.subCategoryFilter) {
    if (product.sub_categories?.id !== Number(filters.subCategoryFilter)) {
      return false;
    }
  }

  // Filter by search term if provided
  if (filters.searchTerm) {
    const search = filters.searchTerm.toLowerCase();
    if (!product.name?.toLowerCase().includes(search)) {
      return false;
    }
  }

  // Passed all filters
  return true;
});

  useEffect(() => {
    if (setFiltredLength) setFiltredLength(filteredProducts.length);
  }, [filteredProducts, setFiltredLength]);
 

const totalValue = filteredProducts.reduce((sum, product) => {
  const productTotal = product.product_sale_units?.reduce(
    (s, unit) => s + unit.price * unit.stock_quantity,
    0
  ) || 0;
  return sum + productTotal;
}, 0);

  // const totalValue = 0

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading inventory...</p>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
        <h3 className="font-medium text-gray-700 mb-2">No products found</h3>
      </div>
    );
  }


  return (
    <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
      {filteredProducts.map((product) => (
        <ProductRow
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          handleOpenDialog={handleOpenDialog}
          handleOpenDelDialog={handleOpenDelDialog}
        />
      ))}
      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="text-sm text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
        </div>
        <div className="text-sm font-semibold text-gray-700">
          Total inventory value: ${totalValue.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
