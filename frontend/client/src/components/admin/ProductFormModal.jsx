import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, AlertCircle, X, Trash2, MoveUp, MoveDown, Scissors } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import ImageCropper from "../ui/ImageCropper";
import { categoryService } from "../../services/categoryService";
import { brandService } from "../../services/productService";
import { adminProductService } from "../../services/adminProductService";
import { adminBrandService } from "../../services/adminBrandService";

const ProductFormModal = ({ isOpen, onClose, onSaved, product }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [currentImageToCrop, setCurrentImageToCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  // Quick Add Brand Inline State
  const [showQuickBrand, setShowQuickBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  const loadDropdowns = () => {
    categoryService.getCategories().then((res) => setCategories(res.data || [])).catch(() => { });
    brandService.getBrands().then((res) => setBrands(res.data || [])).catch(() => { });
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    if (product) {
      reset({
        title: product.title,
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price,
        discountPrice: product.discountPrice,
        stock: product.stock,
        category: product.category?._id || "",
        brand: product.brand?._id || "",
      });
      // Load existing images with proper structure
      console.log('Loading product images:', product.images);
      if (product.images && product.images.length > 0) {
        const previews = product.images.map((img, index) => ({
          preview: img.url || img, // Handle both url and direct string formats
          isNew: false,
          existingImage: img
        }));
        console.log('Setting image previews:', previews);
        setImagePreviews(previews);
      } else {
        console.log('No existing images found');
        setImagePreviews([]);
      }
    } else {
      reset({
        title: "",
        description: "",
        shortDescription: "",
        price: "",
        discountPrice: "",
        stock: "",
        category: "",
        brand: "",
      });
      setImagePreviews([]);
    }
    setImages([]);
    setShowQuickBrand(false);
  }, [product, isOpen]);

  const handleCreateBrandInline = async (e) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setIsCreatingBrand(true);
    try {
      const res = await adminBrandService.createBrand({ name: newBrandName.trim() });
      toast.success("Brand created!");
      const newBrand = res.data;
      setBrands((prev) => [...prev, newBrand]);
      setValue("brand", newBrand._id);
      setNewBrandName("");
      setShowQuickBrand(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create brand");
    } finally {
      setIsCreatingBrand(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPreviews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isNew: true
    }));

    setImagePreviews(prev => [...prev, ...newPreviews]);
    setImages(prev => [...prev, ...files]);
  };

  const handleRemoveImage = (index) => {
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      // Only revoke URL for new images (blob URLs)
      if (newPreviews[index].isNew) {
        URL.revokeObjectURL(newPreviews[index].preview);
      }
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    setImages(prev => {
      const newImages = [...prev];
      // Only remove from images array if it's a new file
      if (prev[index]) {
        newImages.splice(index, 1);
      }
      return newImages;
    });
  };

  const handleMoveImage = (fromIndex, toIndex) => {
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      const [movedItem] = newPreviews.splice(fromIndex, 1);
      newPreviews.splice(toIndex, 0, movedItem);
      return newPreviews;
    });
    setImages(prev => {
      const newImages = [...prev];
      const [movedItem] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedItem);
      return newImages;
    });
  };

  const handleCropImage = (index) => {
    setCurrentImageToCrop(index);
    setShowCropper(true);
  };

  const handleCropComplete = (croppedFile) => {
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      // Revoke old preview URL if it was a blob
      if (newPreviews[currentImageToCrop].isNew) {
        URL.revokeObjectURL(newPreviews[currentImageToCrop].preview);
      }
      newPreviews[currentImageToCrop] = {
        file: croppedFile,
        preview: URL.createObjectURL(croppedFile),
        isNew: true,
        existingImage: null // Clear existing image reference since we're replacing it
      };
      return newPreviews;
    });
    setImages(prev => {
      const newImages = [...prev];
      // Ensure the images array is properly synced
      if (!newImages[currentImageToCrop]) {
        newImages[currentImageToCrop] = croppedFile;
      } else {
        newImages[currentImageToCrop] = croppedFile;
      }
      return newImages;
    });
    setShowCropper(false);
    setCurrentImageToCrop(null);
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
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length === 0) return;

    const newPreviews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isNew: true
    }));

    setImagePreviews(prev => [...prev, ...newPreviews]);
    setImages(prev => [...prev, ...files]);
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value);
        }
      });
      // Handle image submission - only send new files
      formData.append("imageOrder", JSON.stringify(imagePreviews.map((img) => ({
        existingImageId: img.existingImage?._id || null,
        isNew: img.isNew,
      }))));

      const newImages = imagePreviews.filter(img => img.isNew).map(img => img.file);
      newImages.forEach((file) => formData.append("images", file));

      if (product) {
        await adminProductService.updateProduct(product._id, formData);
        toast.success("Product updated successfully");
      } else {
        await adminProductService.createProduct(formData);
        toast.success("Product created successfully");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save product");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? "Edit Product" : "Add New Product"} size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2 pb-4">
        <Input
          label="Title"
          className="sm:col-span-2"
          {...register("title", { required: "Title is required" })}
          error={errors.title?.message}
        />

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            Description <span className="text-[var(--red)]">*</span>
          </label>
          <textarea
            rows={3}
            className={`input-field ${errors.description
                ? "!border-[var(--red)] !bg-[var(--red-bg)] focus:!ring-2 focus:!ring-[var(--red)]/20 input-error"
                : ""
              }`}
            {...register("description", { required: "Description is required" })}
          />
          {errors.description && (
            <p className="flex items-center gap-1 text-xs font-medium text-[var(--red)] input-error mt-1">
              <AlertCircle size={12} className="shrink-0" />
              <span>{errors.description.message}</span>
            </p>
          )}
        </div>

        <Input label="Short Description" className="sm:col-span-2" {...register("shortDescription")} />

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            Category <span className="text-[var(--red)]">*</span>
          </label>
          <select
            className={`input-field ${errors.category
                ? "!border-[var(--red)] !bg-[var(--red-bg)] focus:!ring-2 focus:!ring-[var(--red)]/20 input-error"
                : ""
              }`}
            {...register("category", { required: "Category is required" })}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="flex items-center gap-1 text-xs font-medium text-[var(--red)] input-error mt-1">
              <AlertCircle size={12} className="shrink-0" />
              <span>{errors.category.message}</span>
            </p>
          )}
        </div>

        {/* Brand */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Brand (Optional)
            </label>
            <button
              type="button"
              onClick={() => setShowQuickBrand(!showQuickBrand)}
              className="text-[11px] font-semibold text-amber-600 hover:underline flex items-center gap-0.5"
            >
              <Plus size={12} /> Add New
            </button>
          </div>

          {showQuickBrand ? (
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Brand name..."
                className="input-field !py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={handleCreateBrandInline}
                disabled={isCreatingBrand}
                className="btn-primary !py-1.5 !px-3 text-xs shrink-0"
              >
                Save
              </button>
            </div>
          ) : (
            <select className="input-field" {...register("brand")}>
              <option value="">Select brand (or leave blank)</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <Input
          label="Price (â‚¹)"
          type="number"
          step="0.01"
          {...register("price", { required: "Price is required", min: 0 })}
          error={errors.price?.message}
        />
        <Input label="Discount Price (â‚¹)" type="number" step="0.01" {...register("discountPrice")} />

        <Input
          label="Stock Quantity"
          type="number"
          {...register("stock", { required: "Stock is required", min: 0 })}
          error={errors.stock?.message}
        />

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
            Product Images
          </label>

          {/* Image Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Plus size={24} className="text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Click to upload or drag and drop
              </span>
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">
                PNG, JPG, GIF up to 10MB each
              </span>
            </label>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 lg:grid-cols-4">
              {imagePreviews.map((img, index) => (
                <div
                  key={`${index}-${img.preview}`}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  <img
                    src={img.preview}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', img.preview);
                      e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                    }}
                  />

                  {/* Image Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCropImage(index)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Crop image"
                    >
                      <Scissors size={16} className="text-gray-800" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveImage(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move left"
                    >
                      <MoveUp size={16} className="text-gray-800 -rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveImage(index, Math.min(imagePreviews.length - 1, index + 1))}
                      disabled={index === imagePreviews.length - 1}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move right"
                    >
                      <MoveDown size={16} className="text-gray-800 -rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>

                  {/* Image Number Badge */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>

                  {/* Existing Image Indicator */}
                  {!img.isNew && (
                    <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded">
                      Existing
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sm:col-span-2 pt-2">
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            {product ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </form>

      {/* Image Cropper Modal */}
      {showCropper && currentImageToCrop !== null && (
        <ImageCropper
          image={imagePreviews[currentImageToCrop]?.preview}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setCurrentImageToCrop(null);
          }}
          aspectRatio={1}
        />
      )}
    </Modal>
  );
};

export default ProductFormModal;