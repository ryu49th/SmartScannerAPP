import { useState } from "react";
import { Loader2, XCircle } from "lucide-react";

// Imports
import { api } from "./services/api";
import type { Product } from "./services/api";

import Header from "./components/Header";
import ModeToggle from "./components/ModeToggle";
import ProductCard from "./components/ProductCard";
import RegisterForm from "./components/RegisterForm";
import RealTimeCamera from "./components/RealTimeCamera";

export default function App() {
  // State
  const [mode, setMode] = useState<"SCAN" | "REGISTER">("SCAN");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);

  // 1. Handle Scanning (Sent to Backend)
  const handleScan = async (image: string) => {
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

  // 2. Handle Camera Capture (Decides what to do based on Mode)
  const onCameraCapture = (image: string) => {
      if (mode === "SCAN") {
          handleScan(image);
      } else {
          setTempImage(image); // Save image for Registration form
      }
  };

  // 3. Handle Registration Submit
  const handleRegisterSubmit = async (name: string, price: string) => {
      if (!name || !price || !tempImage) return;

      setLoading(true);
      await api.registerProduct({ name, price, image: tempImage });
      setRegSuccess(true);
      setLoading(false);
      setTempImage(null); 
  };

  const resetRegister = () => {
    setRegSuccess(false);
    setTempImage(null);
  };

  return (
    // 1. New Gradient Background
    <div className="min-h-screen flex flex-col font-sans bg-gradient-to-b from-slate-50 to-slate-200 text-slate-800">
      <Header />

      <main className="flex-1 container mx-auto max-w-md p-4 flex flex-col gap-6">
        
        {/* Toggle with improved shadow */}
        <div className="shadow-lg shadow-slate-200/50 rounded-xl">
          <ModeToggle 
            mode={mode} 
            setMode={(m) => { 
              setMode(m); 
              setProduct(null); 
              setError(null); 
              setRegSuccess(false); 
              setTempImage(null);
            }} 
          />
        </div>

        {/* --- CAMERA SECTION --- */}
        {tempImage ? (
          <div className="relative rounded-3xl overflow-hidden border-4 border-amber-500 shadow-2xl aspect-[4/3] bg-black animate-in fade-in">
              <img src={tempImage} alt="Captured" className="w-full h-full object-contain" />
              <button 
                onClick={() => setTempImage(null)} 
                className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white p-2 rounded-full hover:bg-red-500 transition-colors"
              >
                <XCircle size={24} />
              </button>
          </div>
        ) : (
          <div className="shadow-2xl shadow-slate-400/20 rounded-3xl">
            <RealTimeCamera onCapture={onCameraCapture} />
          </div>
        )}

        {/* --- CONTROL PANEL --- */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 min-h-[150px] relative">
          
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 rounded-3xl">
              <Loader2 className="animate-spin mb-3 text-indigo-600" size={40} />
              <p className="font-bold text-indigo-900 animate-pulse">Analyzing...</p>
            </div>
          )}

          {/* MODE: SCAN RESULTS */}
          {!loading && mode === "SCAN" && (
            <>
              {!product && !error && (
                <div className="text-center text-slate-400 py-6">
                  <p className="text-sm font-medium">Align object within frame</p>
                  <p className="text-xs opacity-60 mt-1">AI detection is active</p>
                </div>
              )}
              
              {product && <ProductCard product={product} onReset={() => setProduct(null)} />}
              
              {error && (
                <div className="text-center py-6 animate-in shake">
                  <div className="bg-red-100 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle size={32} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">No Match Found</h3>
                  <p className="text-slate-500 text-sm mb-4">This item is not in our database yet.</p>
                  <button onClick={() => setMode("REGISTER")} className="text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                    + Add New Item
                  </button>
                </div>
              )}
            </>
          )}

          {!loading && mode === "REGISTER" && (
             <div className="animate-in fade-in slide-in-from-bottom-4">
               {!tempImage && !regSuccess && (
                  <div className="text-center py-8 text-slate-400">
                    <p>Snap a photo to begin registration</p>
                  </div>
               )}
               
               {(tempImage || regSuccess) && (
                 <RegisterForm 
                   onSubmit={handleRegisterSubmit} 
                   success={regSuccess} 
                   onReset={resetRegister} 
                 />
               )}
             </div>
          )}

        </div>
      </main>
    </div>
  );
}