import { useState, useRef, useCallback, useEffect } from 'react';
import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

interface FaceDetectionResult {
  detected: boolean;
  confidence: number;
  box?: faceapi.Box;
}

export const useFaceDetection = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [faceResult, setFaceResult] = useState<FaceDetectionResult>({
    detected: false,
    confidence: 0,
  });
  
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadModels = useCallback(async () => {
    if (modelsLoaded || isLoadingModels) return;
    
    setIsLoadingModels(true);
    try {
      console.log('Loading face detection models...');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      ]);
      console.log('Face detection models loaded successfully');
      setModelsLoaded(true);
    } catch (error) {
      console.error('Error loading face detection models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  }, [modelsLoaded, isLoadingModels]);

  const detectFace = useCallback(async (
    videoElement: HTMLVideoElement
  ): Promise<FaceDetectionResult> => {
    if (!modelsLoaded) {
      return { detected: false, confidence: 0 };
    }

    try {
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.5,
      });

      const detection = await faceapi
        .detectSingleFace(videoElement, options)
        .withFaceLandmarks(true);

      if (detection) {
        return {
          detected: true,
          confidence: detection.detection.score,
          box: detection.detection.box,
        };
      }
    } catch (error) {
      console.error('Face detection error:', error);
    }

    return { detected: false, confidence: 0 };
  }, [modelsLoaded]);

  const startContinuousDetection = useCallback((
    videoElement: HTMLVideoElement,
    onDetection?: (result: FaceDetectionResult) => void
  ) => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    const runDetection = async () => {
      if (videoElement.readyState >= 2) {
        const result = await detectFace(videoElement);
        setFaceResult(result);
        onDetection?.(result);
      }
    };

    // Run detection every 200ms for smooth updates
    detectionIntervalRef.current = setInterval(runDetection, 200);
  }, [detectFace]);

  const stopContinuousDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setFaceResult({ detected: false, confidence: 0 });
  }, []);

  const drawFaceOverlay = useCallback((
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    faceBox?: faceapi.Box
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (faceBox) {
      // Draw face bounding box
      ctx.strokeStyle = '#22c55e'; // green-500
      ctx.lineWidth = 3;
      ctx.strokeRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);

      // Draw corner accents
      const cornerLength = 20;
      ctx.lineWidth = 4;
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(faceBox.x, faceBox.y + cornerLength);
      ctx.lineTo(faceBox.x, faceBox.y);
      ctx.lineTo(faceBox.x + cornerLength, faceBox.y);
      ctx.stroke();

      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(faceBox.x + faceBox.width - cornerLength, faceBox.y);
      ctx.lineTo(faceBox.x + faceBox.width, faceBox.y);
      ctx.lineTo(faceBox.x + faceBox.width, faceBox.y + cornerLength);
      ctx.stroke();

      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(faceBox.x, faceBox.y + faceBox.height - cornerLength);
      ctx.lineTo(faceBox.x, faceBox.y + faceBox.height);
      ctx.lineTo(faceBox.x + cornerLength, faceBox.y + faceBox.height);
      ctx.stroke();

      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(faceBox.x + faceBox.width - cornerLength, faceBox.y + faceBox.height);
      ctx.lineTo(faceBox.x + faceBox.width, faceBox.y + faceBox.height);
      ctx.lineTo(faceBox.x + faceBox.width, faceBox.y + faceBox.height - cornerLength);
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    return () => {
      stopContinuousDetection();
    };
  }, [stopContinuousDetection]);

  return {
    modelsLoaded,
    isLoadingModels,
    faceResult,
    loadModels,
    detectFace,
    startContinuousDetection,
    stopContinuousDetection,
    drawFaceOverlay,
  };
};
