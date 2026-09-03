import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, Download } from "lucide-react";

const ProductImageGalleryModal = ({ isOpen, onClose, product }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!isOpen || !product || !product.images || product.images.length === 0) {
    return null;
  }

  const images = product.images;
  const currentImage = images[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage.url;
    link.download = `product-image-${currentIndex + 1}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {product.title || product.name} - Images
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-col gap-4">
            {/* Main Image Display */}
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }}>
              <img
                src={currentImage.url}
                alt={`${product.title || product.name} - Image ${currentIndex + 1}`}
                className={`w-full h-full object-contain cursor-pointer transition-transform duration-300 ${
                  isZoomed ? 'scale-150' : 'scale-100'
                }`}
                onClick={handleImageClick}
              />
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-gray-900 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={24} className="text-gray-800 dark:text-gray-200" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-gray-900 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight size={24} className="text-gray-800 dark:text-gray-200" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentIndex + 1} / {images.length}
                </div>
              )}

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={handleImageClick}
                  className="p-2 bg-white dark:bg-gray-900 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title={isZoomed ? "Zoom out" : "Zoom in"}
                >
                  <ZoomIn size={20} className="text-gray-800 dark:text-gray-200" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 bg-white dark:bg-gray-900 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Download image"
                >
                  <Download size={20} className="text-gray-800 dark:text-gray-200" />
                </button>
              </div>
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? 'border-blue-500 ring-2 ring-blue-500/50'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Image Info */}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">Image {currentIndex + 1}</span>
                {currentImage.altText && (
                  <span className="ml-2 text-gray-500">- {currentImage.altText}</span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {images.length} {images.length === 1 ? 'image' : 'images'} total
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductImageGalleryModal;