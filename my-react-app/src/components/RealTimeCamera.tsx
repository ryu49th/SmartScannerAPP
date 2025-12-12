import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { ScanLine, Aperture } from "lucide-react";

interface Props {
  onCapture: (imageSrc: string) => void;
}

export default function RealTimeCamera({ onCapture }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [loading, setLoading] = useState(true);

  // Load Model
  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
      setLoading(false);
    };
    loadModel();
  }, []);

  // Detection Loop
  useEffect(() => {
    if (!model) return;
    let animationId: number;

    const detectFrame = async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        const video = webcamRef.current.video;
        const { videoWidth, videoHeight } = video;

        if (canvasRef.current) {
          canvasRef.current.width = videoWidth;
          canvasRef.current.height = videoHeight;
          
          const predictions = await model.detect(video);
          const ctx = canvasRef.current.getContext("2d");
          
          if (ctx) {
            ctx.clearRect(0, 0, videoWidth, videoHeight);
            
            predictions.forEach((prediction) => {
              const [x, y, width, height] = prediction.bbox;
              
              // 1. Draw Glassmorphism Box
              ctx.fillStyle = "rgba(0, 255, 0, 0.1)";
              ctx.fillRect(x, y, width, height);

              // 2. Draw Glowing Border
              ctx.strokeStyle = "#00FF00";
              ctx.lineWidth = 2;
              ctx.shadowColor = "#00FF00";
              ctx.shadowBlur = 10;
              ctx.strokeRect(x, y, width, height);
              
              // 3. Draw Label Tag
              ctx.shadowBlur = 0; // Reset shadow for text
              ctx.fillStyle = "#00FF00";
              ctx.fillRect(x, y > 20 ? y - 25 : y, width, 20);
              
              ctx.fillStyle = "#000000";
              ctx.font = "bold 12px sans-serif";
              ctx.fillText(
                `${prediction.class.toUpperCase()} ${Math.round(prediction.score * 100)}%`,
                x + 5,
                y > 20 ? y - 10 : y + 14
              );
            });
          }
        }
      }
      animationId = requestAnimationFrame(detectFrame);
    };

    detectFrame();
    return () => cancelAnimationFrame(animationId);
  }, [model]);

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-2xl shadow-slate-200 border border-slate-800 aspect-[4/3] group">
      
      {/* LOADING STATE */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white">
          <Aperture className="animate-spin text-emerald-400 mb-4" size={48} />
          <p className="font-mono text-emerald-400 text-sm tracking-widest uppercase">Initializing System...</p>
        </div>
      )}
      
      {/* WEBCAM */}
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "environment" }} // Use back camera on mobile
        className="absolute inset-0 w-full h-full object-cover opacity-90"
      />
      
      {/* AI DRAWING LAYER */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

      {/* SCANNING LASER EFFECT */}
      {!loading && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-scan opacity-70"></div>
        </div>
      )}

      {/* CAPTURE BUTTON (Floating) */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
        <button 
          onClick={() => {
            const image = webcamRef.current?.getScreenshot();
            if (image) onCapture(image);
          }}
          className="group relative"
        >
          {/* Outer Ring */}
          <div className="w-20 h-20 rounded-full border-4 border-white/30 group-active:scale-95 transition-all duration-200"></div>
          {/* Inner Button */}
          <div className="absolute top-2 left-2 w-16 h-16 bg-white rounded-full shadow-lg group-hover:bg-red-500 transition-colors duration-300 flex items-center justify-center">
            <ScanLine className="text-slate-900 group-hover:text-white transition-colors" size={24} />
          </div>
        </button>
      </div>
    </div>
  );
}