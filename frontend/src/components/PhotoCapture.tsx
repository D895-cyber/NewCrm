import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface PhotoCaptureProps {
  onPhotosChange: (photos: PhotoData[]) => void;
  initialPhotos?: PhotoData[];
  maxPhotos?: number;
  disabled?: boolean;
}

export interface PhotoData {
  id: string;
  file: File;
  preview: string;
  description: string;
  category: 'BEFORE' | 'DURING' | 'AFTER' | 'ISSUE' | 'PARTS' | 'OTHER';
  timestamp: Date;
  compressed?: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onPhotosChange,
  initialPhotos = [],
  maxPhotos = 10,
  disabled = false
}) => {
  const [photos, setPhotos] = useState<PhotoData[]>(initialPhotos);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compress image to reduce file size
  const compressImage = useCallback((file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800px width)
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsCapturing(true);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setError('Camera access denied. Please allow camera permission and try again.');
      setIsCapturing(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setIsCapturing(false);
  }, [stream]);

  // Capture photo from camera
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          // Compress the image
          const compressedFile = await compressImage(file);
          
          const newPhoto: PhotoData = {
            id: `photo_${Date.now()}`,
            file: compressedFile,
            preview: URL.createObjectURL(compressedFile),
            description: '',
            category: 'BEFORE',
            timestamp: new Date(),
            compressed: true
          };
          
          const updatedPhotos = [...photos, newPhoto];
          setPhotos(updatedPhotos);
          onPhotosChange(updatedPhotos);
          
          // Stop camera after capture
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    } catch (err) {
      console.error('Photo capture failed:', err);
      setError('Failed to capture photo. Please try again.');
    }
  }, [photos, onPhotosChange, compressImage, stopCamera]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setError(null);
      const newPhotos: PhotoData[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError(`File ${file.name} is not an image. Skipping.`);
          continue;
        }
        
        // Compress image
        const compressedFile = await compressImage(file);
        
        const photo: PhotoData = {
          id: `photo_${Date.now()}_${i}`,
          file: compressedFile,
          preview: URL.createObjectURL(compressedFile),
          description: '',
          category: 'BEFORE',
          timestamp: new Date(),
          compressed: true
        };
        
        newPhotos.push(photo);
      }
      
      if (newPhotos.length > 0) {
        const updatedPhotos = [...photos, ...newPhotos];
        setPhotos(updatedPhotos);
        onPhotosChange(updatedPhotos);
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setError('Failed to process photos. Please try again.');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [photos, onPhotosChange, compressImage]);

  // Update photo description
  const updatePhotoDescription = useCallback((photoId: string, description: string) => {
    const updatedPhotos = photos.map(photo =>
      photo.id === photoId ? { ...photo, description } : photo
    );
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  }, [photos, onPhotosChange]);

  // Update photo category
  const updatePhotoCategory = useCallback((photoId: string, category: PhotoData['category']) => {
    const updatedPhotos = photos.map(photo =>
      photo.id === photoId ? { ...photo, category } : photo
    );
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  }, [photos, onPhotosChange]);

  // Remove photo
  const removePhoto = useCallback((photoId: string) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  }, [photos, onPhotosChange]);

  // Get category badge color
  const getCategoryBadgeColor = (category: PhotoData['category']) => {
    const colors = {
      BEFORE: 'bg-blue-100 text-blue-800',
      DURING: 'bg-yellow-100 text-yellow-800',
      AFTER: 'bg-green-100 text-green-800',
      ISSUE: 'bg-red-100 text-red-800',
      PARTS: 'bg-purple-100 text-purple-800',
      OTHER: 'bg-gray-100 text-gray-800'
    };
    return colors[category];
  };

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Photo Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Photos: {photos.length}/{maxPhotos}
        </div>
        {photos.length > 0 && (
          <div className="text-xs text-gray-500">
            Total size: {Math.round(photos.reduce((sum, photo) => sum + photo.file.size, 0) / 1024)} KB
          </div>
        )}
      </div>

      {/* Capture Controls */}
      {!showCamera && (
        <div className="flex gap-2">
          <Button
            onClick={startCamera}
            disabled={disabled || photos.length >= maxPhotos}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || photos.length >= maxPhotos}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      )}

      {/* Camera View */}
      {showCamera && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Camera</CardTitle>
              <Button variant="outline" size="sm" onClick={stopCamera}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover rounded-lg bg-gray-100"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={capturePhoto} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Capture Photo
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <div className="aspect-video bg-gray-100">
                <img
                  src={photo.preview}
                  alt={photo.description || 'Service photo'}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <CardContent className="p-3 space-y-2">
                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryBadgeColor(photo.category)}>
                    {photo.category}
                  </Badge>
                  {photo.compressed && (
                    <Badge variant="outline" className="text-xs">
                      Compressed
                    </Badge>
                  )}
                </div>
                
                {/* Description Input */}
                <input
                  type="text"
                  placeholder="Photo description..."
                  value={photo.description}
                  onChange={(e) => updatePhotoDescription(photo.id, e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  disabled={disabled}
                />
                
                {/* Category Select */}
                <select
                  value={photo.category}
                  onChange={(e) => updatePhotoCategory(photo.id, e.target.value as PhotoData['category'])}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  disabled={disabled}
                >
                  <option value="BEFORE">Before Service</option>
                  <option value="DURING">During Service</option>
                  <option value="AFTER">After Service</option>
                  <option value="ISSUE">Issue Found</option>
                  <option value="PARTS">Parts Used</option>
                  <option value="OTHER">Other</option>
                </select>
                
                {/* Remove Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removePhoto(photo.id)}
                  disabled={disabled}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        disabled={disabled}
      />

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Photos are automatically compressed to reduce file size</p>
        <p>• Use "Before Service" for initial state photos</p>
        <p>• Use "After Service" for completed work photos</p>
        <p>• Maximum {maxPhotos} photos allowed</p>
      </div>
    </div>
  );
};

export default PhotoCapture;



















