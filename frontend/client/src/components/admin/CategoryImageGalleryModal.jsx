import { useState } from "react";
import { X, ZoomIn, Download } from "lucide-react";

const CategoryImageGalleryModal = ({ isOpen, onClose, category }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!isOpen || !category || !category.image || !category.image.url) {
    return null;
  }

  const imageUrl = category.image.url;

  const handleImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `category-${category.name || category.slug}.jpg`;
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
            {category.name} - Category Image
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
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <img
                src={imageUrl}
                alt={`${category.name} - Category Image`}
                className={`w-full h-full object-contain cursor-pointer transition-transform duration-300 ${
                  isZoomed ? 'scale-150' : 'scale-100'
                }`}
                onClick={handleImageClick}
              />

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

            {/* Image Info */}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">Category Image</span>
                <span className="ml-2 text-gray-500">- {category.name}</span>
              </div>
              <div className="text-xs text-gray-500">
                1 image
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryImageGalleryModal;
