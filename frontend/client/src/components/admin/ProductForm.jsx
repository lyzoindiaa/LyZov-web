import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, AlertCircle, Scissors, MoveUp, MoveDown, Trash2, ArrowLeft, ArrowRight, CheckCircle2, Lock, Box, Tag, Image as ImageIcon, Package, Globe, Sparkles } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("basic"); // "basic" | "category" | "pricing" | "images"
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  // Watch form values for step completion
  const formValues = watch();

  // Step completion calculations
  const isStep1Complete = Boolean(
    formValues?.lyId?.trim() &&
    formValues?.title?.trim() &&
    formValues?.description?.trim()
  );

  const isStep2Complete = Boolean(
    isStep1Complete &&
    (formValues?.category || selectedL1 || selectedL2 || selectedL3)
  );

  const isStep3Complete = Boolean(
    isStep2Complete &&
    formValues?.price &&
    formValues?.stock !== undefined && formValues?.stock !== ""
  );

  const isStep4Complete = Boolean(
    isStep3Complete &&
    imagePreviews.length > 0
  );

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
        slug: product.slug || "",
        mpn: product.mpn || "",
        metaTitle: product.seo?.metaTitle || "",
        metaDescription: product.seo?.metaDescription || "",
        canonicalUrl: product.seo?.canonicalUrl || "",
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
        slug: "",
        mpn: "",
        metaTitle: "",
        metaDescription: "",
        canonicalUrl: "",
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

  const onFormError = (formErrors) => {
    if (!formErrors) return;
    const errorKeys = Object.keys(formErrors);
    if (errorKeys.length === 0) return;

    const basicFields = ["lyId", "title", "description", "shortDescription", "hsnNumber", "gstRate"];
    const categoryFields = ["category", "brand"];
    const pricingFields = ["price", "discountPrice", "stock"];

    if (errorKeys.some((k) => basicFields.includes(k))) {
      setActiveTab("basic");
    } else if (errorKeys.some((k) => categoryFields.includes(k))) {
      setActiveTab("category");
    } else if (errorKeys.some((k) => pricingFields.includes(k))) {
      setActiveTab("pricing");
    }
    const firstError = Object.values(formErrors)[0]?.message || "Please check required fields across all tabs.";
    toast.error(firstError);
  };

  const handleTabClick = (tabKey) => {
    if (tabKey === "category" && !isStep1Complete) {
      toast.warning("🔒 Step 1 (Basic Information) must be completed before accessing Category.");
      return;
    }
    if (tabKey === "pricing" && !isStep2Complete) {
      toast.warning("🔒 Step 2 (Category Selection) must be completed before accessing Pricing.");
      return;
    }
    if (tabKey === "images" && !isStep3Complete) {
      toast.warning("🔒 Step 3 (Pricing & Stock) must be completed before accessing Images.");
      return;
    }
    if (tabKey === "seo" && !isStep1Complete) {
      toast.warning("🔒 Step 1 (Basic Information) must be completed to preview SEO.");
      return;
    }
    setActiveTab(tabKey);
  };

  return (
    <div className="max-w-5xl mx-auto">
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

      {/* Progressive Step Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-hairline pb-2 dark:border-hairline-dark mb-6">
        {/* Step 1 Tab */}
        <button
          type="button"
          onClick={() => handleTabClick("basic")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "basic"
            ? "bg-[var(--accent)] text-white shadow-sm"
            : isStep1Complete
              ? "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
              : "text-[var(--accent)] bg-[var(--accent-bg)]"
            }`}
        >
          <Package size={16} />
          <span>1. Basic Info</span>
          {isStep1Complete ? (
            <CheckCircle2 size={15} className="text-emerald-500 ml-1" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Incomplete" />
          )}
        </button>

        {/* Step 2 Tab */}
        <button
          type="button"
          onClick={() => handleTabClick("category")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "category"
            ? "bg-[var(--accent)] text-white shadow-sm"
            : isStep1Complete
              ? isStep2Complete
                ? "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
                : "text-[var(--accent)] bg-[var(--accent-bg)]"
              : "opacity-50 cursor-not-allowed text-stone bg-[var(--bg-subtle)]"
            }`}
        >
          <Box size={16} />
          <span>2. Category</span>
          {!isStep1Complete ? (
            <Lock size={14} className="text-stone ml-1" title="Locked: Complete Step 1 first" />
          ) : isStep2Complete ? (
            <CheckCircle2 size={15} className="text-emerald-500 ml-1" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Incomplete" />
          )}
        </button>

        {/* Step 3 Tab */}
        <button
          type="button"
          onClick={() => handleTabClick("pricing")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "pricing"
            ? "bg-[var(--accent)] text-white shadow-sm"
            : isStep2Complete
              ? isStep3Complete
                ? "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
                : "text-[var(--accent)] bg-[var(--accent-bg)]"
              : "opacity-50 cursor-not-allowed text-stone bg-[var(--bg-subtle)]"
            }`}
        >
          <Tag size={16} />
          <span>3. Pricing & Stock</span>
          {!isStep2Complete ? (
            <Lock size={14} className="text-stone ml-1" title="Locked: Complete Step 2 first" />
          ) : isStep3Complete ? (
            <CheckCircle2 size={15} className="text-emerald-500 ml-1" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Incomplete" />
          )}
        </button>

        {/* Step 4 Tab */}
        <button
          type="button"
          onClick={() => handleTabClick("images")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "images"
            ? "bg-[var(--accent)] text-white shadow-sm"
            : isStep3Complete
              ? isStep4Complete
                ? "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
                : "text-[var(--accent)] bg-[var(--accent-bg)]"
              : "opacity-50 cursor-not-allowed text-stone bg-[var(--bg-subtle)]"
            }`}
        >
          <ImageIcon size={16} />
          <span>4. Images</span>
          {!isStep3Complete ? (
            <Lock size={14} className="text-stone ml-1" title="Locked: Complete Step 3 first" />
          ) : isStep4Complete ? (
            <CheckCircle2 size={15} className="text-emerald-500 ml-1" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Incomplete" />
          )}
        </button>

        {/* Step 5 Tab (Optional SEO) */}
        <button
          type="button"
          onClick={() => handleTabClick("seo")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "seo"
            ? "bg-[var(--accent)] text-white shadow-sm"
            : isStep1Complete
              ? "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
              : "opacity-50 cursor-not-allowed text-stone bg-[var(--bg-subtle)]"
            }`}
        >
          <Globe size={16} />
          <span>5. SEO (Optional)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent)] font-medium">
            Auto
          </span>
        </button>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit, onFormError)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Tab 1: Basic Information */}
        {activeTab === "basic" && (
          <div className="card-surface p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline dark:border-hairline-dark">
              <div>
                <h3 className="font-display text-lg font-bold">Step 1: Basic Information</h3>
                <p className="text-xs text-stone mt-0.5">
                  All fields marked with <span className="text-rose-500 font-bold">*</span> are mandatory to unlock Step 2.
                </p>
              </div>
              {isStep1Complete && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Step 1 Completed
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="LY ID *"
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
                label="Title *"
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
            </div>

            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-stone">Saving will automatically unlock Step 2 (Category)</span>
              <Button
                type="button"
                onClick={() => handleTabClick("category")}
                className="flex items-center gap-2"
              >
                <span>Continue to Step 2</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Category Selection */}
        {activeTab === "category" && (
          <div className="card-surface p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline dark:border-hairline-dark">
              <div>
                <h3 className="font-display text-lg font-bold">Step 2: Category Selection</h3>
                <p className="text-xs text-stone mt-0.5">
                  Select the appropriate category hierarchy for your product <span className="text-rose-500 font-bold">*</span>.
                </p>
              </div>
              {isStep2Complete && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Step 2 Completed
                </span>
              )}
            </div>

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
            <div className="mt-4">
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

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className="text-xs text-stone hover:text-[var(--ink)] underline font-medium"
              >
                ← Back to Step 1
              </button>
              <Button
                type="button"
                onClick={() => handleTabClick("pricing")}
                className="flex items-center gap-2"
              >
                <span>Continue to Step 3</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Pricing & Stock */}
        {activeTab === "pricing" && (
          <div className="card-surface p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline dark:border-hairline-dark">
              <div>
                <h3 className="font-display text-lg font-bold">Step 3: Pricing & Stock</h3>
                <p className="text-xs text-stone mt-0.5">
                  Set pricing and inventory details <span className="text-rose-500 font-bold">*</span>.
                </p>
              </div>
              {isStep3Complete && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Step 3 Completed
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Price (₹) *"
                type="number"
                step="0.01"
                {...register("price", { required: "Price is required", min: 0 })}
                error={errors.price?.message}
              />
              <Input label="Discount Price (₹)" type="number" step="0.01" {...register("discountPrice")} />

              <Input
                label="Stock Quantity *"
                type="number"
                {...register("stock", { required: "Stock is required", min: 0 })}
                error={errors.stock?.message}
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("category")}
                className="text-xs text-stone hover:text-[var(--ink)] underline font-medium"
              >
                ← Back to Step 2
              </button>
              <Button
                type="button"
                onClick={() => handleTabClick("images")}
                className="flex items-center gap-2"
              >
                <span>Continue to Step 4</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Tab 4: Images */}
        {activeTab === "images" && (
          <div className="card-surface p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline dark:border-hairline-dark">
              <div>
                <h3 className="font-display text-lg font-bold">Step 4: Product Images</h3>
                <p className="text-xs text-stone mt-0.5">
                  Upload product images <span className="text-rose-500 font-bold">*</span>.
                </p>
              </div>
              {isStep4Complete && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Images Added
                </span>
              )}
            </div>

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

            <div className="flex items-center justify-between pt-4 sm:col-span-2">
              <button
                type="button"
                onClick={() => setActiveTab("pricing")}
                className="text-xs text-stone hover:text-[var(--ink)] underline font-medium"
              >
                ← Back to Step 3
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("seo")}
                  className="px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/50 transition-colors flex items-center gap-1.5"
                >
                  <Globe size={14} /> Customize SEO →
                </button>
                <Button type="submit" isLoading={isSubmitting || isLoading} className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{product ? "Save Changes" : "Create Product"}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: SEO & Google Search Preview */}
        {activeTab === "seo" && (
          <div className="card-surface p-6 sm:p-8 col-span-1 sm:col-span-2 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2 pb-4 border-b border-hairline dark:border-hairline-dark">
              <div>
                <h3 className="font-display text-lg font-bold">Step 5: Search Engine Optimization (SEO)</h3>
                <p className="text-xs text-stone mt-0.5">
                  LyZov automatically generates high-ranking Google metadata. All fields below are completely optional.
                </p>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5">
                <Sparkles size={14} /> Auto-Optimized
              </span>
            </div>

            {/* Google Search Result Preview Simulator */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-hairline dark:border-hairline-dark shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone">
                  Google Search Snippet Preview
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Preview
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-lg border border-slate-200 dark:border-zinc-800 font-sans max-w-xl">
                <div className="text-[12px] text-[#202124] dark:text-[#bdc1c6] flex items-center gap-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-[9px] font-bold">L</span>
                  <span>LyZov Store</span>
                  <span className="text-slate-400">›</span>
                  <span className="truncate">product › {formValues.slug || "product-url-slug"}</span>
                </div>
                <div className="text-[18px] text-[#1a0dab] dark:text-[#8ab4f8] font-medium leading-snug hover:underline cursor-pointer truncate">
                  {formValues.metaTitle?.trim() || (formValues.title?.trim() ? `${formValues.title.trim()} | Buy Online at LyZov` : "Product Title | Buy Online at LyZov")}
                </div>
                <div className="text-[13px] text-[#4d5156] dark:text-[#bdc1c6] mt-1 line-clamp-2 leading-relaxed">
                  {formValues.metaDescription?.trim() ||
                    (formValues.shortDescription?.trim() || formValues.description?.trim()
                      ? `${(formValues.shortDescription || formValues.description).replace(/<[^>]*>?/gm, "").slice(0, 150)} — Shop genuine products with Pan-India delivery on LyZov.`
                      : "Shop premium quality products online at LyZov Store. Fast delivery across India and hassle-free support.")}
                </div>
              </div>
            </div>

            {/* Form Inputs for SEO */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Custom Metadata Overrides</h4>
                <button
                  type="button"
                  onClick={() => {
                    const cleanTitle = (formValues.title || "").trim();
                    const cleanDesc = (formValues.shortDescription || formValues.description || "").replace(/<[^>]*>?/gm, "").trim();
                    if (cleanTitle) {
                      setValue("metaTitle", `${cleanTitle} | Buy Online at LyZov`, { shouldValidate: true });
                    }
                    if (cleanDesc) {
                      setValue("metaDescription", `${cleanDesc.slice(0, 145)} — Pan-India Delivery on LyZov.`, { shouldValidate: true });
                    }
                    toast.success("Generated SEO recommendations from product details!");
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Sparkles size={12} /> Auto-Generate from Title & Description
                </button>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Meta Title (Optional)
                  </label>
                  <span className={`text-[11px] ${(formValues.metaTitle?.length || 0) > 60 ? "text-amber-500 font-semibold" : "text-stone"}`}>
                    {formValues.metaTitle?.length || 0} / 60 recommended
                  </span>
                </div>
                <Input
                  {...register("metaTitle")}
                  placeholder={formValues.title ? `${formValues.title} | Buy Online at LyZov` : "Leave blank to auto-generate"}
                  error={errors.metaTitle?.message}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Meta Description (Optional)
                  </label>
                  <span className={`text-[11px] ${(formValues.metaDescription?.length || 0) > 160 ? "text-amber-500 font-semibold" : "text-stone"}`}>
                    {formValues.metaDescription?.length || 0} / 160 recommended
                  </span>
                </div>
                <textarea
                  {...register("metaDescription")}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-hairline dark:border-hairline-dark bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  placeholder="Leave blank to auto-generate from product description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Manufacturer Part Number (MPN) (Optional)
                  </label>
                  <Input
                    {...register("mpn")}
                    placeholder="e.g. MFG-8849-V2"
                  />
                  <p className="text-[11px] text-stone mt-1">
                    Authentic manufacturer part number only. Do <strong>not</strong> enter SKU or internal store IDs here.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Custom URL Slug (Optional)
                  </label>
                  <Input
                    {...register("slug")}
                    placeholder="e.g. mens-cotton-running-tshirt"
                  />
                  <p className="text-[11px] text-stone mt-1">
                    Leave blank for default URL. Changing an existing slug automatically preserves search ranking with a 301 redirect.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("images")}
                className="text-xs text-stone hover:text-[var(--ink)] underline font-medium"
              >
                ← Back to Step 4 (Images)
              </button>
              <Button type="submit" isLoading={isSubmitting || isLoading} className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{product ? "Save Changes" : "Create Product"}</span>
              </Button>
            </div>
          </div>
        )}
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