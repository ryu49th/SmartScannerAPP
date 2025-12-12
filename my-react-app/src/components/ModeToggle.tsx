import { Scan, PlusCircle } from "lucide-react";

interface Props {
  mode: "SCAN" | "REGISTER";
  setMode: (m: "SCAN" | "REGISTER") => void;
}

export default function ModeToggle({ mode, setMode }: Props) {
  return (
    <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex mb-4">
      <button
        onClick={() => setMode("SCAN")}
        className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
          mode === "SCAN" ? "bg-red-600 text-white shadow" : "text-slate-500"
        }`}
      >
        <Scan size={18} /> SCAN
      </button>
      <button
        onClick={() => setMode("REGISTER")}
        className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
          mode === "REGISTER" ? "bg-amber-500 text-white shadow" : "text-slate-500"
        }`}
      >
        <PlusCircle size={18} /> REGISTER
      </button>
    </div>
  );
}