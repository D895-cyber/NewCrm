import React, { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw, Check, Upload, X, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface SignaturePadProps {
  onSignatureChange: (signature: string | null) => void;
  initialSignature?: string | null;
  title: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignatureChange,
  initialSignature = null,
  title,
  placeholder = "Sign here",
  disabled = false,
  required = false
}) => {
  const [signature, setSignature] = useState<string | null>(initialSignature);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSignature, setHasSignature] = useState(!!initialSignature);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    
    // Scale context for crisp lines
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Set drawing properties
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature if available
    if (initialSignature) {
      loadSignatureFromData(initialSignature);
    }
  }, [initialSignature]);

  // Load signature from base64 data
  const loadSignatureFromData = useCallback((data: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHasSignature(true);
    };
    img.src = data;
  }, []);

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    setIsDrawing(true);
    setError(null);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.type === 'mousedown' 
      ? (e as React.MouseEvent).clientX - rect.left
      : (e as React.TouchEvent).touches[0].clientX - rect.left;
    const y = e.type === 'mousedown'
      ? (e as React.MouseEvent).clientY - rect.top
      : (e as React.TouchEvent).touches[0].clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [disabled]);

  // Draw
  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.type === 'mousemove'
      ? (e as React.MouseEvent).clientX - rect.left
      : (e as React.TouchEvent).touches[0].clientX - rect.left;
    const y = e.type === 'mousemove'
      ? (e as React.MouseEvent).clientY - rect.top
      : (e as React.TouchEvent).touches[0].clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, disabled]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    setHasSignature(true);
    
    // Convert to base64 and notify parent
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL('image/png');
      setSignature(dataURL);
      onSignatureChange(dataURL);
    }
  }, [isDrawing, onSignatureChange]);

  // Clear signature
  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
    setHasSignature(false);
    onSignatureChange(null);
    setError(null);
  }, [onSignatureChange]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file is too large. Please select a file smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target?.result as string;
      if (dataURL) {
        loadSignatureFromData(dataURL);
        setSignature(dataURL);
        onSignatureChange(dataURL);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError('Failed to load image. Please try again.');
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [loadSignatureFromData, onSignatureChange]);

  // Get signature dimensions
  const getSignatureDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { width: 0, height: 0 };
    
    return {
      width: canvas.width / window.devicePixelRatio,
      height: canvas.height / window.devicePixelRatio
    };
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {title}
            {required && <span className="text-red-500">*</span>}
          </CardTitle>
          {hasSignature && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Signed
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Signature Canvas */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
          <canvas
            ref={canvasRef}
            className="w-full h-32 bg-white border border-gray-200 rounded cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ touchAction: 'none' }}
          />
          
          {!hasSignature && (
            <div className="text-center text-gray-500 text-sm mt-2">
              {placeholder}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={disabled || !hasSignature}
            className="flex-1 min-w-0"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-1 min-w-0"
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={disabled}
        />

        {/* Signature Info */}
        {hasSignature && (
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Signature captured successfully</p>
            <p>• Size: {getSignatureDimensions().width} × {getSignatureDimensions().height}px</p>
            <p>• Format: PNG (Base64 encoded)</p>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Draw your signature with mouse or finger</p>
          <p>• Or upload a scanned signature image</p>
          <p>• Signature will be embedded in the PDF report</p>
          {required && <p className="text-red-500">• This signature is required</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export default SignaturePad;








