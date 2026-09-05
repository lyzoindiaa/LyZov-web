import { useState, useEffect } from "react";
import { Plus, Scissors, Trash2, ArrowLeft, Layers, CornerDownRight } from "lucide-react";
import { toast } from "react-toastify";
import Input from "../ui/Input";
import Button from "../ui/Button";
import ImageCropper from "../ui/ImageCropper";
import { categoryService } from "../../services/categoryService";

const CategoryForm = ({ category, initialParent, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    parent: initialParent || "",
    displayOrder: 0,
  });
  const [categories, setCategories] = useState([]);
  const [categoryImage, setCategoryImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Load all categories for parent selector
  useEffect(() => {
    categoryService
      .getCategories({ includeInactive: true })
      .then((res) => {
        setCategories(res.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        imageUrl: category.image?.url || "",
        parent: category.parent?._id || category.parent || "",
        displayOrder: category.displayOrder || 0,
      });
      setImagePreview(category.image?.url || "");
      setCategoryImage(null);
    } else {
      setFormData({
        name: "",
        description: "",
        imageUrl: "",
        parent: initialParent || "",
        displayOrder: 0,
      });
      setCategoryImage(null);
      setImagePreview("");
    }
  }, [category, initialParent]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
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
    if (file && file.type.startsWith("image/")) {
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
      payload.append("name", formData.name.trim());
      payload.append("description", formData.description.trim());
      payload.append("parent", formData.parent || "");
      payload.append("displayOrder", formData.displayOrder || 0);
      if (categoryImage) payload.append("image", categoryImage);

      await onSubmit(payload);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save category");
      throw err;
    }
  };

  // Filter out self and descendants when editing
  const eligibleParents = categories.filter((c) => {
    if (category && c._id === category._id) return false;
    if (category && (c.ancestors || []).some((a) => a._id === category._id)) return false;
    // Only Level 1 (Category) and Level 2 (Subcategory) can be parents
    return (c.level || 1) < 3;
  });

  // Determine current parent doc and calculated level
  const selectedParentDoc = categories.find((c) => c._id === formData.parent);
  const calculatedLevel = selectedParentDoc ? Math.min((selectedParentDoc.level || 1) + 1, 3) : 1;
  const levelNames = {
    1: "Level 1 — Main Category (e.g. Men, Women, Accessories)",
    2: "Level 2 — Subcategory (e.g. Clothing, Footwear, Leather Goods)",
    3: "Level 3 — Item Type (e.g. Shirts, Sneakers, Wallets)",
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
            {category
              ? "Update category hierarchy, details, and imagery"
              : "Create a root category, subcategory, or item"}
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Parent Category Selector */}
        <div className="rounded-xl border border-hairline bg-cream/10 p-4 dark:border-hairline-dark dark:bg-charcoal/30">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone flex items-center gap-1.5">
              <Layers size={14} className="text-[var(--accent)]" /> Category Hierarchy Level
            </label>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--accent-bg)] text-[var(--accent)]">
              {levelNames[calculatedLevel]}
            </span>
          </div>

          <div className="space-y-3 mt-2">
            <select
              name="parent"
              value={formData.parent}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-hairline bg-white dark:bg-charcoal p-2.5 text-sm outline-none focus:border-ink dark:border-hairline-dark dark:focus:border-cream"
            >
              <option value="">None (Top-Level Category — Level 1)</option>
              <optgroup label="Root Categories (Level 1) — Choose to make a Subcategory (Level 2)">
                {eligibleParents
                  .filter((c) => (c.level || 1) === 1)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      📁 {c.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Subcategories (Level 2) — Choose to make an Item (Level 3)">
                {eligibleParents
                  .filter((c) => (c.level || 1) === 2)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      ↳ {c.ancestors?.[0]?.name ? `${c.ancestors[0].name} > ` : ""}{c.name}
                    </option>
                  ))}
              </optgroup>
            </select>

            {/* Breadcrumb Preview */}
            <div className="flex items-center gap-1.5 text-xs text-stone bg-white/60 dark:bg-charcoal/60 px-3 py-2 rounded-lg border border-hairline dark:border-hairline-dark">
              <CornerDownRight size={13} className="text-[var(--accent)]" />
              <span>Hierarchy Path:</span>
              <span className="font-semibold text-ink dark:text-cream">
                {selectedParentDoc ? (
                  <>
                    {(selectedParentDoc.ancestors || []).map((a) => (
                      <span key={a._id} className="text-stone font-normal">
                        {a.name} &gt;{" "}
                      </span>
                    ))}
                    <span className="text-stone font-normal">{selectedParentDoc.name} &gt; </span>
                    <span>{formData.name || "[Category Name]"}</span>
                  </>
                ) : (
                  <span>{formData.name || "[Top Level Category]"}</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <Input
          label="Category Name"
          value={formData.name}
          onChange={handleInputChange}
          name="name"
          placeholder="e.g. Men, Clothing, Formal Shirts"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Display Order
            </label>
            <input
              type="number"
              name="displayOrder"
              value={formData.displayOrder}
              onChange={handleInputChange}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent p-2.5 text-sm outline-none focus:border-blue-500 dark:bg-gray-800 dark:focus:border-blue-400"
            />
            <p className="mt-1 text-[11px] text-stone">Lower numbers display first (0, 1, 2...)</p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
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
          <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Category Image
          </label>

          {/* Image Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
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
          aspectRatio={16 / 9}
        />
      )}
    </div>
  );
};

export default CategoryForm;