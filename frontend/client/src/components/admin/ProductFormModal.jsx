import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { categoryService, brandService } from "../../services/productService";
import { adminProductService } from "../../services/adminProductService";
import { adminBrandService } from "../../services/adminBrandService";

const ProductFormModal = ({ isOpen, onClose, onSaved, product }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [images, setImages] = useState([]);

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
    categoryService.getCategories().then((res) => setCategories(res.data || [])).catch(() => {});
    brandService.getBrands().then((res) => setBrands(res.data || [])).catch(() => {});
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

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value);
        }
      });
      images.forEach((file) => formData.append("images", file));

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
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            className={`input-field ${
              errors.description
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
            className={`input-field ${
              errors.category
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
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages(Array.from(e.target.files))}
            className="block w-full text-xs text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white dark:file:bg-white dark:file:text-black cursor-pointer"
          />
        </div>

        <div className="sm:col-span-2 pt-2">
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            {product ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductFormModal;