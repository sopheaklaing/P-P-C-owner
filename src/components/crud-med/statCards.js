import { Package, DollarSign, AlertTriangle, BarChart3 } from "lucide-react";

function StatCard({ title, value, icon, description, warning }) {
  return (
    <div
      className={`bg-white rounded-xl border p-4 shadow-sm ${
        warning ? "border-red-200" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{title}</span>
        {icon}
      </div>
      <div
        className={`text-2xl font-bold mt-2 ${
          warning ? "text-red-600" : "text-gray-800"
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{description}</div>
    </div>
  );
}

export default function QuickStats({ products,filtredLength }) {
  // const totalStock = products.reduce(
  //   (sum, p) => sum + calculateTotalStock(p.product_sale_units),
  //   0
  // );
  // const totalValue = products.reduce(
  //   (sum, p) => sum + calculateTotalValue(p.product_sale_units),
  //   0
  // );
  // const lowStockCount = products.filter(
  //   (p) => calculateTotalStock(p.product_sale_units) <= p.reorder_level
  // ).length;
  const totalStock = filtredLength
  const totalValue =0
  const lowStockCount = 0 
  const averagePrice = products.length ? totalValue / totalStock : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
      <StatCard
        title="Products"
        value={totalStock}
        icon={<Package size={18} className="text-blue-500" />}
        description="units across all products"
      />
      <StatCard
        title="Total Value"
        value={`$${totalValue.toFixed(0)}`}
        icon={<DollarSign size={18} className="text-green-500" />}
        description="inventory worth"
      />
        {/* <StatCard
        title="Low Stock Items"
        value={lowStockCount}
        icon={<AlertTriangle size={18} />}
        warning={lowStockCount > 0}
        description="need reordering"
      /> 
      <StatCard
        title="Avg Price"
        value={`$${averagePrice.toFixed(2)}`}
        icon={<BarChart3 size={18} className="text-purple-500" />}
        description="per unit"
      />  */}
    </div>
  );
}
