import { Button } from "@/components/ui/button";
import { Pill, RefreshCw, Plus } from "lucide-react";

export default function StatisticHeader({ loading, onRefresh, onAdd }) {
  return (
    <div className="mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Pill size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Medication Inventory
            </h1>
            <p className="text-sm text-gray-500">
              Manage your pharmacy stock efficiently
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="h-10 gap-2"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button
            onClick={onAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 gap-2"
            size="sm"
          >
            <Plus size={16} />
            Add Product
          </Button>
        </div>
      </div>
    </div>
  );
}
