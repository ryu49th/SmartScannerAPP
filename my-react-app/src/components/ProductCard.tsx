import { CheckCircle2, RotateCcw } from "lucide-react";
import type { Product } from "../services/api";

interface Props {
  product: Product;
  onReset: () => void;
}

export default function ProductCard({ product, onReset }: Props) {
  return (
    <div className="animate-in zoom-in-95 duration-300">
      
      {/* Success Badge */}
      <div className="flex justify-center -mt-10 mb-4">
        <div className="bg-emerald-500 text-white p-3 rounded-full shadow-lg shadow-emerald-200">
          <CheckCircle2 size={32} />
        </div>
      </div>

      <div className="text-center mb-6">
        <p className="text-xs font-bold tracking-widest text-emerald-600 uppercase mb-1">Identification Successful</p>
        <h2 className="text-2xl font-black text-slate-800 leading-tight">{product.name}</h2>
        <p className="text-slate-400 text-sm mt-1">{product.category || "General Item"}</p>
      </div>

      {/* Price Ticket */}
      <div className="relative bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Estimated Price</p>
            <span className="text-4xl font-black text-slate-900">฿{product.price}</span>
          </div>
          <div className="text-right">
             <div className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded">
               {Math.round(product.confidence * 100)}% Match
             </div>
          </div>
        </div>
      </div>

      <button 
        onClick={onReset} 
        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <RotateCcw size={18} /> Scan Next Item
      </button>
    </div>
  );
}