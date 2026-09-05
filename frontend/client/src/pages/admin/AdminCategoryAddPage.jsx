import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { categoryService } from "../../services/categoryService";
import CategoryForm from "../../components/admin/CategoryForm";

const AdminCategoryAddPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialParent = searchParams.get("parent") || "";
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (payload) => {
    try {
      setIsLoading(true);
      await categoryService.createCategory(payload);
      toast.success("Category created successfully");
      navigate("/seller/categories");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create category");
      throw err; // Re-throw to let form handle error state
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/seller/categories");
  };

  return (
    <div className="container-page py-8">
      <CategoryForm
        category={null}
        initialParent={initialParent}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdminCategoryAddPage;