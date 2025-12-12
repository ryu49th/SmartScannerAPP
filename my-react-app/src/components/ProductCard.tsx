import { CheckCircle2 } from "lucide-react";
import type { Product } from "../services/api";

interface Props {
  product: Product;
  onReset: () => void;
}

export default function ProductCard({ product, onReset }: Props) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 text-green-600 mb-2 font-bold">
        <CheckCircle2 size={24} /> Found
      </div>
      <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
      <div className="my-3 bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
        <span className="text-slate-500">Price</span>
        <span className="text-2xl font-bold text-red-600">฿{product.price}</span>
      </div>
      <button 
        onClick={onReset} 
        className="w-full py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
      >
        Scan Next
      </button>
    </div>
  );
}