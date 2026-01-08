import { Button} from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Search, Filter, AlertTriangle, Calendar } from "lucide-react";

export default function Filters({
  searchTerm,
  setSearchTerm,
  mainCategoryFilter,
  setMainCategoryFilter,
  subCategoryFilter,
  setSubCategoryFilter,
  showLowStock,
  setShowLowStock,
  showExpiringSoon,
  setShowExpiringSoon,
  mainCategories = [],
  subCategories = [],
  lowStockCount = 0,
  expiringSoonCount = 0,
  clearFilters,
}) {




    
  return (
    <div className="my-4 space-y-3">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search by name, generic, manufacturer..."
            className="w-full pl-10 pr-4 h-12 text-sm rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              className="w-full h-12 pl-10 pr-8 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
              value={mainCategoryFilter}
              onChange={(e) => {
                setMainCategoryFilter(e.target.value);
                setSubCategoryFilter("");
              }}
            >
              <option value="">All Categories</option>
              {mainCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1">
            <select
              className="w-full h-12 pl-3 pr-8 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
              value={subCategoryFilter}
              onChange={(e) => setSubCategoryFilter(e.target.value)}
              disabled={!mainCategoryFilter}
            >
              <option value="">All Sub-Categories</option>
              {subCategories
                .filter((cat) => !mainCategoryFilter || cat.main_category_id === parseInt(mainCategoryFilter))
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={showLowStock ? "default" : "outline"}
          size="sm"
         // onClick={() => setShowLowStock(!showLowStock)}
          className={`h-10 text-sm gap-2 px-4 rounded-xl ${
            showLowStock
              ? "bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-sm"
              : "border-gray-300 hover:bg-red-50 hover:text-red-600"
          }`}
        >
          <AlertTriangle size={16} /> Low Stock
          {lowStockCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">{lowStockCount}</span>
          )}
        </Button>

        <Button
          variant={showExpiringSoon ? "destructive" : "outline"}
          size="sm"
          //onClick={() => setShowExpiringSoon(!showExpiringSoon)}
          className={`h-10 text-sm gap-2 px-4 rounded-xl ${
            showExpiringSoon
              ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500 shadow-sm"
              : "border-gray-300 hover:bg-orange-50 hover:text-orange-600"
          }`}
        >
          <Calendar size={16} /> Expiring Soon
          {expiringSoonCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">{expiringSoonCount}</span>
          )}
        </Button>

        {(searchTerm || mainCategoryFilter || subCategoryFilter || showLowStock || showExpiringSoon) && (
          <Button onClick={clearFilters} variant="ghost" size="sm" className="h-10 text-sm text-gray-600 hover:text-gray-800 rounded-xl">
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  );
}
