import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { adminProductService } from "../../services/adminProductService";
import ProductForm from "../../components/admin/ProductForm";
import { loadDraft } from "../../hooks/useDraft";

const AdminProductAddPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Read optional draftKey from query string (?draft=LYZOV-XXXXXX)
  const draftKeyFromUrl = searchParams.get("draft") || null;

  // Validate the draft key exists in localStorage; fall back to null
  const [draftKey, setDraftKey] = useState(() => {
    if (draftKeyFromUrl && loadDraft(draftKeyFromUrl)) {
      return draftKeyFromUrl;
    }
    return null;
  });

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      await adminProductService.createProduct(formData);
      toast.success("Product created successfully! 🎉");
      navigate("/seller/products");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create product");
      throw err; // Re-throw to let form handle error state
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/seller/products");
  };

  const handleDraftSaved = (savedKey) => {
    // Update URL to include draft key so the page can be bookmarked/refreshed
    if (savedKey && savedKey !== draftKeyFromUrl) {
      navigate(`/seller/products/add?draft=${savedKey}`, { replace: true });
    }
    setDraftKey(savedKey);
  };

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-6">
      <ProductForm
        product={null}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        draftKey={draftKey}
        onDraftSaved={handleDraftSaved}
      />
    </div>
  );
};

export default AdminProductAddPage;