import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, AlertCircle, Scissors, MoveUp, MoveDown, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import Input from "../ui/Input";
import Button from "../ui/Button";
import ImageCropper from "../ui/ImageCropper";
import { categoryService } from "../../services/categoryService";
import { brandService } from "../../services/productService";
import { adminProductService } from "../../services/adminProductService";
import { adminBrandService } from "../../services/adminBrandService";
import { GST_RATES } from "../../data/gstRates";

const createDraftLyId = () => `LYZOV-${String(Date.now()).slice(-6)}`;

const ProductForm = ({ product, onSubmit, onCancel, isLoading }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [currentImageToCrop, setCurrentImageToCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Multi-level category hierarchy states
  const [selectedL1, setSelectedL1] = useState("");
  const [selectedL2, setSelectedL2] = useState("");
  const [selectedL3, setSelectedL3] = useState("");

  // Quick Add Brand Inline State
  const [showQuickBrand, setShowQuickBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  const loadDropdowns = () => {
    categoryService.getCategories({ includeInactive: true }).then((res) => setCategories(res.data || [])).catch(() => { });
    brandService.getBrands().then((res) => setBrands(res.data || [])).catch(() => { });
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  // Sync category cascading levels when editing or categories loaded
  useEffect(() => {
    if (!product || categories.length === 0) return;
    const catId = product.category?._id || product.category;
    if (!catId) return;

    const catDoc = categories.find((c) => c._id === catId);
    if (!catDoc) {
      setSelectedL1(catId);
      return;
    }

    if (catDoc.level === 3) {
      setSelectedL3(catDoc._id);
      const parentId = catDoc.parent?._id || catDoc.parent;
      setSelectedL2(parentId || "");
      const rootId = catDoc.ancestors?.[0]?._id;
      setSelectedL1(rootId || "");
    } else if (catDoc.level === 2) {
      setSelectedL3("");
      setSelectedL2(catDoc._id);
      const rootId = catDoc.parent?._id || catDoc.parent || catDoc.ancestors?.[0]?._id;
      setSelectedL1(rootId || "");
    } else {
      setSelectedL3("");
      setSelectedL2("");
      setSelectedL1(catDoc._id);
    }
  }, [product, categories]);

  const handleL1Change = (e) => {
    const val = e.target.value;
    setSelectedL1(val);
    setSelectedL2("");
    setSelectedL3("");
    setValue("category", val, { shouldValidate: true });
  };

  const handleL2Change = (e) => {
    const val = e.target.value;
    setSelectedL2(val);
    setSelectedL3("");
    setValue("category", val || selectedL1, { shouldValidate: true });
  };

  const handleL3Change = (e) => {
    const val = e.target.value;
    setSelectedL3(val);
    setValue("category", val || selectedL2 || selectedL1, { shouldValidate: true });
  };

  const l1Categories = categories.filter((c) => (c.level || 1) === 1);
  const l2Categories = categories.filter((c) => {
    const pId = c.parent?._id ? c.parent._id.toString() : c.parent ? c.parent.toString() : "";
    return (c.level || 1) === 2 && pId === selectedL1;
  });
  const l3Categories = categories.filter((c) => {
    const pId = c.parent?._id ? c.parent._id.toString() : c.parent ? c.parent.toString() : "";
    return (c.level || 1) === 3 && pId === selectedL2;
  });

  const selectedCategoryDoc = categories.find((c) => {
    const currentId = selectedL3 || selectedL2 || selectedL1;
    return c._id === currentId;
  });

  useEffect(() => {
    if (product) {
      reset({
        lyId: product.lyId || createDraftLyId(),
        hsnNumber: product.hsnNumber || "",
        gstRate: product.gstRate || "",
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
        lyId: createDraftLyId(),
        hsnNumber: "",
        gstRate: "",
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
  }, [product]);

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

  const onFormSubmit = async (data) => {
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

      await onSubmit(formData);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save product");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {product ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {product ? "Update product information and images" : "Create a new product for your store"}
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

      <form onSubmit={handleSubmit(onFormSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="LY ID"
          {...register("lyId", {
            required: "LY ID is required",
            pattern: { value: /^LYZOV-[A-Z0-9-]+$/i, message: "LY ID must start with LYZOV-" },
          })}
          error={errors.lyId?.message}
        />

        <Input label="HSN Number" {...register("hsnNumber")} />

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
            GST Rate
          </label>
          <select className="input-field" {...register("gstRate")}>
            <option value="">Select GST rate</option>
            {GST_RATES.map((gstRate) => (
              <option key={gstRate} value={gstRate}>
                {gstRate}
              </option>
            ))}
          </select>
        </div>

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

        {/* Multi-Level Category Selection */}
        <div className="sm:col-span-2 rounded-xl border border-hairline bg-cream/10 p-4 dark:border-hairline-dark dark:bg-charcoal/30">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5">
              Category Hierarchy <span className="text-[var(--red)]">*</span>
            </label>
            {selectedCategoryDoc && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent)]/20">
                Level {selectedCategoryDoc.level || 1}: {selectedCategoryDoc.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Step 1: Main Category */}
            <div>
              <label className="mb-1 block text-[11px] font-medium text-stone">
                1. Main Category (L1)
              </label>
              <select
                value={selectedL1}
                onChange={handleL1Change}
                className={`input-field text-xs ${errors.category && !selectedL1 ? "!border-[var(--red)] !bg-[var(--red-bg)]" : ""
                  }`}
              >
                <option value="">Select Main Category</option>
                {l1Categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    📁 {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Subcategory */}
            <div>
              <label className="mb-1 block text-[11px] font-medium text-stone">
                2. Subcategory (L2)
              </label>
              <select
                value={selectedL2}
                onChange={handleL2Change}
                disabled={!selectedL1 || l2Categories.length === 0}
                className="input-field text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedL1
                    ? "Select Category (L1) first"
                    : l2Categories.length === 0
                      ? "No Subcategories"
                      : "Select Subcategory"}
                </option>
                {l2Categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    ↳ {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Item Type */}
            <div>
              <label className="mb-1 block text-[11px] font-medium text-stone">
                3. Item Type (L3)
              </label>
              <select
                value={selectedL3}
                onChange={handleL3Change}
                disabled={!selectedL2 || l3Categories.length === 0}
                className="input-field text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedL2
                    ? "Select Subcategory (L2) first"
                    : l3Categories.length === 0
                      ? "No Item Types"
                      : "Select Item Type"}
                </option>
                {l3Categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    • {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <input type="hidden" {...register("category", { required: "Category is required" })} />

          {/* Active Breadcrumb Path */}
          {selectedCategoryDoc && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-stone bg-white/60 dark:bg-charcoal/60 px-3 py-2 rounded-lg border border-hairline dark:border-hairline-dark">
              <span className="font-semibold text-ink dark:text-cream">Assigned Hierarchy:</span>
              <span>
                {(selectedCategoryDoc.ancestors || []).map((a) => (
                  <span key={a._id} className="text-stone font-normal">
                    {a.name} &gt;{" "}
                  </span>
                ))}
                <span className="font-semibold text-[var(--accent)]">{selectedCategoryDoc.name}</span>
              </span>
            </div>
          )}

          {errors.category && (
            <p className="flex items-center gap-1 text-xs font-medium text-[var(--red)] input-error mt-2">
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
          label="Price (₹)"
          type="number"
          step="0.01"
          {...register("price", { required: "Price is required", min: 0 })}
          error={errors.price?.message}
        />
        <Input label="Discount Price (₹)" type="number" step="0.01" {...register("discountPrice")} />

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
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Click to upload or drag and drop
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
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
          <Button type="submit" isLoading={isSubmitting || isLoading} className="w-full">
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
    </div>
  );
};

export default ProductForm;