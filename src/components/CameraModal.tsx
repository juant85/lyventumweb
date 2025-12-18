// src/components/CameraModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { ArrowPathIcon } from './Icons';
import Alert from './ui/Alert';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageBlob: Blob) => Promise<void>;
  isSaving: boolean;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture, isSaving }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    
    if (isOpen) {
      setError(null);
      setCapturedImage(null);
      
      const startCamera = async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
          currentStream = mediaStream;
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (err) {
          console.error("Camera access denied:", err);
          setError("Camera access is required. Please enable it in your browser settings and refresh the page.");
        }
      };
      startCamera();

    } else {
      // Cleanup when modal closes
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }

    // Cleanup on component unmount
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if(context) {
          context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setCapturedImage(dataUrl);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = async () => {
    if (capturedImage) {
      try {
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        await onCapture(blob);
      } catch (err) {
        setError("Could not process the captured image. Please try again.")
      }
    }
  };
  
  const footerContent = (
    <div className="w-full flex justify-center items-center gap-4">
        {isSaving ? (
            <Button disabled className="w-full">
                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> Saving...
            </Button>
        ) : capturedImage ? (
            <>
                <Button onClick={handleRetake} variant="neutral" className="w-full">Retake</Button>
                <Button onClick={handleConfirm} variant="primary" className="w-full">Confirm & Save</Button>
            </>
        ) : (
            <Button onClick={handleCapture} disabled={!stream} className="w-full">Capture Photo</Button>
        )}
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Take Attendee Photo" size="lg" footerContent={footerContent}>
      <div className="space-y-4">
        {error && <Alert type="error" message={error} />}
        
        <div className="relative w-full h-64 sm:h-96 md:h-[50vh] bg-slate-900 rounded-lg overflow-hidden">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${capturedImage ? 'opacity-0' : 'opacity-100'}`}
            />
            {capturedImage && (
                <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-cover"/>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </Modal>
  );
};

export default CameraModal;
