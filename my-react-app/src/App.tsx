import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Search, Loader2, XCircle } from "lucide-react";

// Imports
import { api } from "./services/api";
import type { Product } from "./services/api";

import Header from "./components/Header";
import ModeToggle from "./components/ModeToggle";
import ProductCard from "./components/ProductCard";
import RegisterForm from "./components/RegisterForm";

export default function App() {
  const webcamRef = useRef<Webcam>(null);
  
  // State
  const [mode, setMode] = useState<"SCAN" | "REGISTER">("SCAN");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);

  // Actions
  const capture = useCallback(() => {
    return webcamRef.current?.getScreenshot();
  }, [webcamRef]);

  const handleScan = async () => {
    const image = capture();
    if (!image) return;

    setLoading(true);
    setProduct(null);
    setError(null);

    try {
      const result = await api.searchProduct(image);
      if (result) setProduct(result);
      else setError("Product not found.");
    } catch {
      setError("System Error.");
    } finally {
      setLoading(false);
    }
  };

const handleRegister = async (name: string, price: string) => {
    const image = capture();
    
    // --- FIX IS HERE ---
    // We added "|| !image". 
    // This tells TypeScript: "If image is missing, stop immediately."
    if (!name || !price || !image) return; 
    
    setLoading(true);
    // Now TypeScript is happy because it knows 'image' definitely exists here
    await api.registerProduct({ name, price, image });
    setRegSuccess(true);
    setLoading(false);
  };
  const resetRegister = () => {
    setRegSuccess(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-slate-50">
      <Header />

      <main className="flex-1 container mx-auto max-w-md p-4 flex flex-col">
        <ModeToggle 
          mode={mode} 
          setMode={(m) => { setMode(m); setProduct(null); setError(null); setRegSuccess(false); }} 
        />

        {/* WEBCAM */}
        <div className="relative rounded-2xl overflow-hidden bg-black shadow-lg border-4 border-white aspect-video mb-4">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
          />
        </div>

        {/* CONTROL PANEL */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 min-h-[150px]">
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-4 text-slate-400">
              <Loader2 className="animate-spin mb-2 text-red-600" size={32} />
              <p>Processing...</p>
            </div>
          )}

          {/* MODE: SCAN */}
          {!loading && mode === "SCAN" && (
            <>
              {!product && !error && (
                <button onClick={handleScan} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 flex items-center justify-center gap-2">
                  <Search size={20} /> Identify Item
                </button>
              )}
              
              {product && <ProductCard product={product} onReset={() => setProduct(null)} />}
              
              {error && (
                <div className="text-center py-2">
                  <XCircle className="mx-auto text-red-500 mb-2" size={32} />
                  <p className="font-bold">Not Found</p>
                  <button onClick={() => setMode("REGISTER")} className="text-amber-600 font-bold underline mt-2">Register it?</button>
                </div>
              )}
            </>
          )}

          {/* MODE: REGISTER */}
          {!loading && mode === "REGISTER" && (
            <RegisterForm 
              onSubmit={handleRegister} 
              success={regSuccess} 
              onReset={resetRegister} 
            />
          )}

        </div>
      </main>
    </div>
  );
}