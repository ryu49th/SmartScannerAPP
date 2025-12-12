import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface Props {
  onSubmit: (name: string, price: string) => void;
  success: boolean;
  onReset: () => void;
}

export default function RegisterForm({ onSubmit, success, onReset }: Props) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  if (success) {
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="mx-auto text-green-500 mb-2" size={40} />
        <h3 className="text-lg font-bold">Saved!</h3>
        <button onClick={onReset} className="mt-4 px-6 py-2 bg-slate-100 font-bold rounded-lg">
          Add Another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input 
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" 
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input 
        type="number"
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" 
        placeholder="Price (THB)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <button 
        onClick={() => onSubmit(name, price)} 
        className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600"
      >
        Save Item
      </button>
    </div>
  );
}