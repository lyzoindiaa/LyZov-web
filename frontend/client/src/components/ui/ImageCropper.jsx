import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { X, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

const ImageCropper = ({ image, onCropComplete, onCancel, aspectRatio = 1 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const cropperRef = useRef(null);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyCrop = useCallback(async () => {
    if (!croppedAreaPixels) return;
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const imageElement = new Image();
      imageElement.crossOrigin = "anonymous";
      imageElement.src = image;
      
      await new Promise((resolve) => {
        imageElement.onload = resolve;
      });
      
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      
      ctx.drawImage(
        imageElement,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
      
      ctx.restore();
      
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
          onCropComplete(croppedFile);
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  }, [croppedAreaPixels, image, rotation, onCropComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Crop Image</h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800 relative min-h-[250px] sm:min-h-[300px]">
          <Cropper
            ref={cropperRef}
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteHandler}
            cropShape="rect"
            showGrid={true}
            style={{
              containerStyle: {
                width: "100%",
                height: "100%",
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 border-t border-gray-200 dark:border-gray-700">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ZoomOut size={16} sm:size={18} className="text-gray-500 dark:text-gray-400" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <ZoomIn size={16} sm:size={18} className="text-gray-500 dark:text-gray-400" />
          </div>

          {/* Rotation Button */}
          <button
            type="button"
            onClick={handleRotate}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium"
          >
            <RotateCw size={14} sm:size={16} />
            Rotate 90°
          </button>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white text-xs sm:text-sm font-medium"
            >
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;