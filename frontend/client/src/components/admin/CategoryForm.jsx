import { useState, useEffect } from "react";
import { Plus, Scissors, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import Input from "../ui/Input";
import Button from "../ui/Button";
import ImageCropper from "../ui/ImageCropper";

const CategoryForm = ({ category, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({ name: "", description: "", imageUrl: "" });
  const [categoryImage, setCategoryImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        imageUrl: category.image?.url || "",
      });
      setImagePreview(category.image?.url || "");
      setCategoryImage(null);
    } else {
      setFormData({ name: "", description: "", imageUrl: "" });
      setCategoryImage(null);
      setImagePreview("");
    }
  }, [category]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setCategoryImage(file);
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setCategoryImage(null);
    setFormData({ ...formData, imageUrl: "" });
  };

  const handleCropImage = () => {
    if (imagePreview) {
      setShowCropper(true);
    }
  };

  const handleCropComplete = (croppedFile) => {
    const preview = URL.createObjectURL(croppedFile);
    setImagePreview(preview);
    setCategoryImage(croppedFile);
    setShowCropper(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      setCategoryImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("description", formData.description);
      if (categoryImage) payload.append("image", categoryImage);

      await onSubmit(payload);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save category");
      throw err; // Re-throw to let calling component handle error state
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {category ? "Edit Category" : "Add New Category"}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {category ? "Update category information and image" : "Create a new category for your store"}
          </p>
        </div>
        {onCancel && (
          <Button
            variant="secondary"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Category Name"
          value={formData.name}
          onChange={handleInputChange}
          name="name"
          placeholder="e.g. Men, Women, Footwear"
          required
        />
        
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            name="description"
            placeholder="Category overview & details"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent p-3 text-sm outline-none focus:border-blue-500 dark:bg-gray-800 dark:focus:border-blue-400"
          />
        </div>

        {/* Category Image Upload */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">Category Image</label>
          
          {/* Image Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="category-image-upload"
            />
            <label
              htmlFor="category-image-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Plus size={24} className="text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Click to upload or drag and drop
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                PNG, JPG, GIF up to 10MB
              </span>
            </label>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="mt-4 relative">
              <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={imagePreview}
                  alt="Category preview"
                  className="w-full h-full object-cover"
                />
                
                {/* Image Actions Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleCropImage}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Crop image"
                  >
                    <Scissors size={16} className="text-gray-800" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <Trash2 size={16} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fallback URL Input */}
          <div className="mt-3">
            <Input
              label="Or paste image URL"
              value={formData.imageUrl}
              onChange={handleInputChange}
              name="imageUrl"
              placeholder="https://images.unsplash.com/..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" isLoading={isLoading}>
            {category ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      </form>

      {/* Image Cropper Modal */}
      {showCropper && (
        <ImageCropper
          image={imagePreview}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
          aspectRatio={16/9}
        />
      )}
    </div>
  );
};

export default CategoryForm;