import React from "react";

export default function ProductRow({ product, onEdit, onDelete, handleOpenDialog,handleOpenDelDialog }) {
  // Calculate total stock value across all sale units
  const totalValue =
    product.product_sale_units?.reduce(
      (sum, unit) => sum + unit.price * unit.stock_quantity,
      0
    ) || 0;

    const handleClickEdit=()=>{
      onEdit(product)
      handleOpenDialog()
    }

    const handleClickDelete=()=>{
      onDelete(product)
      handleOpenDelDialog()
    }

  return (
<div className="flex flex-col gap-4 p-4 border-b hover:bg-gray-50 md:flex-row md:items-center md:gap-6">
  {/* Product info */}
  <div className="flex items-center gap-4 min-w-70">
    <img
      src={product.image_url}
      alt={product.name}
      className="w-16 h-16 rounded object-cover shrink-0"
    />

    <div className="space-y-1">
<h3 className="font-medium leading-tight max-w-100 ">
  {product.name}
</h3>

      <p className="text-sm text-gray-500">
        Category:{" "}
        <span className="text-gray-700">
          {product.main_categories?.name || product.category_id}
        </span>
      </p>

      <p className="text-sm text-gray-500">
        Sub-Category:{" "}
        <span className="text-gray-700">
          {product.sub_categories?.name || product.sub_category_id}
        </span>
      </p>
    </div>
  </div>

  {/* Sale units */}
  <div className="flex-1 space-y-1 text-sm">
    <div className="flex justify-between">
      <label className="text-sm text-gray-500">
      Sale units :
    </label>
        <label className="text-sm text-gray-500">
      Stock & Price per unit :
    </label>
    </div>

    {product.product_sale_units?.map((unit) => (
      <div
        key={unit.id}
        className="flex justify-between gap-4"
      >
        <span className="font-medium">
          {unit.unit_name}
        </span>

        <span className="text-gray-600 whitespace-nowrap">
          {unit.stock_quantity} × ${unit.price.toFixed(2)} =
          <span className="ml-1 font-medium text-gray-800">
            ${(unit.stock_quantity * unit.price).toFixed(2)}
          </span>
        </span>
      </div>
    ))}

    <div className="pt-1 font-semibold text-gray-900">
      Total Value: ${totalValue.toFixed(2)}
    </div>
  </div>

  {/* Actions */}
  <div className="flex gap-2 md:ml-auto">
    <button
      onClick={() => handleClickEdit()}
      className="px-4 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
    >
      Edit
    </button>

    <button
      onClick={() => handleClickDelete()}
      className="px-4 py-1.5 rounded bg-red-500 text-white hover:bg-red-600 transition"
    >
      Delete
    </button>
  </div>
</div>

  );
}
