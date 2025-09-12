import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Camera, Upload, X, CheckCircle, AlertCircle, Download, Info } from 'lucide-react';
import { apiClient } from '../../utils/api/client';

interface PhotoData {
  id: string;
  file: File;
  preview: string;
  description: string;
  category: string;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function PhotoCaptureTest() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('Before Service');
  const [testVisitId, setTestVisitId] = useState('TEST-VISIT-001');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const categories = [
    'Before Service',
    'During Service', 
    'After Service',
    'Issue Found',
    'Parts Replacement',
    'Quality Check'
  ];

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Check camera permissions
  const checkCameraPermissions = async () => {
    try {
      addDebugInfo('Checking camera permissions...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }

      // Check if we have permission
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        addDebugInfo(`Camera permission status: ${permission.state}`);
        return permission.state;
      }
      
      return 'unknown';
    } catch (error) {
      addDebugInfo(`Permission check error: ${error}`);
      return 'error';
    }
  };

  // Start camera with multiple fallback configurations
  const startCamera = async () => {
    try {
      setIsCapturing(true);
      setCameraError(null);
      addDebugInfo('Starting camera...');
      
      // Check permissions first
      const permissionStatus = await checkCameraPermissions();
      
      // Try different camera configurations
      const cameraConfigs = [
        // Config 1: Back camera with high resolution
        {
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 }
          }
        },
        // Config 2: Back camera with standard resolution
        {
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        },
        // Config 3: Any camera with basic settings
        {
          video: { 
            width: { min: 640 },
            height: { min: 480 }
          }
        },
        // Config 4: Basic video (last resort)
        {
          video: true
        }
      ];

      let stream = null;
      let configIndex = 0;

      while (!stream && configIndex < cameraConfigs.length) {
        try {
          addDebugInfo(`Trying camera config ${configIndex + 1}: ${JSON.stringify(cameraConfigs[configIndex])}`);
          stream = await navigator.mediaDevices.getUserMedia(cameraConfigs[configIndex]);
          addDebugInfo(`Camera stream obtained with config ${configIndex + 1}`);
        } catch (configError: any) {
          addDebugInfo(`Config ${configIndex + 1} failed: ${configError.name} - ${configError.message}`);
          configIndex++;
        }
      }

      if (!stream) {
        throw new Error('All camera configurations failed');
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          addDebugInfo('Video metadata loaded');
          addDebugInfo(`Video dimensions: ${videoRef.current?.videoWidth} x ${videoRef.current?.videoHeight}`);
        };
        
        videoRef.current.onerror = (error) => {
          addDebugInfo(`Video error: ${error}`);
        };

        videoRef.current.oncanplay = () => {
          addDebugInfo('Video can start playing');
        };
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      addDebugInfo(`Camera error: ${error.name} - ${error.message}`);
      
      // Provide specific error messages
      let errorMessage = 'Unable to access camera. ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please grant camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera constraints not supported.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported on this device.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      setCameraError(errorMessage);
      setIsCapturing(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    addDebugInfo('Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        addDebugInfo(`Stopped track: ${track.kind}`);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
    addDebugInfo('Camera stopped');
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      addDebugInfo('Cannot capture: video or canvas not ready');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      addDebugInfo('Capturing photo...');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      addDebugInfo(`Canvas dimensions set to: ${canvas.width} x ${canvas.height}`);
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          addDebugInfo(`Photo captured: ${blob.size} bytes`);
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const photoData: PhotoData = {
            id: Date.now().toString(),
            file,
            preview: URL.createObjectURL(blob),
            description: `${currentCategory} - ${new Date().toLocaleString()}`,
            category: currentCategory,
            uploadStatus: 'pending'
          };
          
          setPhotos(prev => [...prev, photoData]);
          addDebugInfo('Photo added to collection');
        } else {
          addDebugInfo('Failed to create photo blob');
        }
      }, 'image/jpeg', 0.8);
    } else {
      addDebugInfo('Failed to get canvas context');
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addDebugInfo(`File upload: ${files.length} files selected`);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        addDebugInfo(`Processing image: ${file.name} (${file.size} bytes)`);
        const photoData: PhotoData = {
          id: Date.now().toString() + Math.random(),
          file,
          preview: URL.createObjectURL(file),
          description: `${currentCategory} - ${file.name}`,
          category: currentCategory,
          uploadStatus: 'pending'
        };
        
        setPhotos(prev => [...prev, photoData]);
      } else {
        addDebugInfo(`Skipping non-image file: ${file.name}`);
      }
    });
  };

  // Update photo description
  const updatePhotoDescription = (id: string, description: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === id ? { ...photo, description } : photo
    ));
  };

  // Update photo category
  const updatePhotoCategory = (id: string, category: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === id ? { ...photo, category } : photo
    ));
  };

  // Remove photo
  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
        addDebugInfo(`Photo removed: ${photo.description}`);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  // Test upload to backend
  const testUpload = async () => {
    if (photos.length === 0) {
      alert('No photos to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    addDebugInfo(`Starting upload of ${photos.length} photos`);

    try {
      const formData = new FormData();
      photos.forEach(photo => {
        formData.append('photos', photo.file);
        formData.append('descriptions', photo.description);
      });
      formData.append('category', currentCategory);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload to backend
      const response = await apiClient.uploadServiceVisitPhotosAutomated(
        testVisitId, 
        formData, 
        currentCategory
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Update photo status
      setPhotos(prev => prev.map(photo => ({
        ...photo,
        uploadStatus: 'success' as const
      })));

      addDebugInfo(`Upload successful: ${response}`);
      alert(`Successfully uploaded ${photos.length} photos!`);

    } catch (error: any) {
      console.error('Upload error:', error);
      addDebugInfo(`Upload failed: ${error.message}`);
      
      // Update photo status
      setPhotos(prev => prev.map(photo => ({
        ...photo,
        uploadStatus: 'error' as const,
        error: error.message
      })));

      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Clear debug info
  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Photo Capture Test</h1>
        <p className="text-gray-600">Test photo capture and upload functionality for FSE mobile portal</p>
      </div>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visitId">Test Visit ID</Label>
              <Input
                id="visitId"
                value={testVisitId}
                onChange={(e) => setTestVisitId(e.target.value)}
                placeholder="Enter test visit ID"
              />
            </div>
            <div>
              <Label htmlFor="category">Photo Category</Label>
              <Select value={currentCategory} onValueChange={setCurrentCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Camera Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Capture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isCapturing ? (
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                <Camera className="h-16 w-16 text-gray-400" />
              </div>
              <Button onClick={startCamera} className="w-full">
                Start Camera
              </Button>
              {cameraError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {cameraError}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex gap-2">
                <Button onClick={capturePhoto} className="flex-1">
                  Capture Photo
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  Stop Camera
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fileUpload">Upload Photos</Label>
              <Input
                id="fileUpload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="mt-2"
              />
            </div>
            <p className="text-sm text-gray-500">
              Select multiple image files to upload and test
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Photos Grid */}
      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Captured Photos ({photos.length})</span>
              <Button 
                onClick={testUpload} 
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Test Upload
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Upload Progress */}
            {isUploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Upload Progress</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Photos Grid */}
            <div className="grid grid-cols-2 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="space-y-2">
                  <div className="relative">
                    <img
                      src={photo.preview}
                      alt={photo.description}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => removePhoto(photo.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      {photo.uploadStatus === 'success' && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      )}
                      {photo.uploadStatus === 'error' && (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      )}
                      {photo.uploadStatus === 'uploading' && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                          Uploading
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      value={photo.description}
                      onChange={(e) => updatePhotoDescription(photo.id, e.target.value)}
                      placeholder="Photo description"
                      className="text-sm"
                    />
                    <Select 
                      value={photo.category} 
                      onValueChange={(value) => updatePhotoCategory(photo.id, value)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Debug Information
            </span>
            <Button onClick={clearDebugInfo} variant="outline" size="sm">
              Clear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-40 overflow-y-auto bg-gray-100 p-3 rounded-lg">
            {debugInfo.length === 0 ? (
              <p className="text-gray-500 text-sm">No debug information yet...</p>
            ) : (
              debugInfo.map((info, index) => (
                <div key={index} className="text-xs font-mono text-gray-700 mb-1">
                  {info}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Use the camera to capture photos or upload existing image files</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Add descriptions and categorize photos appropriately</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Test upload functionality to verify backend integration</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Check debug information for troubleshooting camera issues</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

