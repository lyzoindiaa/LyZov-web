import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { categoryService } from "../../services/categoryService";
import CategoryForm from "../../components/admin/CategoryForm";

const AdminCategoryAddPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const targetPath = user?.role === "admin" ? "/admin/categories" : "/seller/categories";

  const [searchParams] = useSearchParams();
  const initialParent = searchParams.get("parent") || "";
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (payload) => {
    try {
      setIsLoading(true);
      await categoryService.createCategory(payload);
      toast.success("Category created successfully");
      navigate(targetPath);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create category");
      throw err; // Re-throw to let form handle error state
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(targetPath);
  };

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-6">
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