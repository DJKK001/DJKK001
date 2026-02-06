
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Icons } from '../constants';

interface ImageCaptureProps {
  onCapture: (data: string) => void;
  onClose: () => void;
  title?: string;
}

const ImageCapture: React.FC<ImageCaptureProps> = ({ onCapture, onClose, title = "Capturar Imagem" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
      console.error(err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const takePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/jpeg');
        setCapturedImage(data);
        stream?.getTracks().forEach(track => track.stop());
      }
    }
  }, [stream]);

  const reset = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-white font-bold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="text-red-400 p-8 text-center">
              <Icons.AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p>{error}</p>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captura" className="w-full h-full object-contain" />
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-8 flex justify-center gap-6 bg-slate-950">
          {capturedImage ? (
            <>
              <button 
                onClick={reset}
                className="px-8 py-3 bg-slate-800 text-white rounded-full font-bold hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <Icons.X className="w-5 h-5" /> Tentar Novamente
              </button>
              <button 
                onClick={() => onCapture(capturedImage)}
                className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Icons.CheckCircle2 className="w-5 h-5" /> Usar Foto
              </button>
            </>
          ) : (
            <button 
              onClick={takePhoto}
              disabled={!!error}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
            >
              <div className="w-12 h-12 border-4 border-slate-900 rounded-full" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageCapture;
