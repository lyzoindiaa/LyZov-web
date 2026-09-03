import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { categoryService } from "../../services/categoryService";
import CategoryForm from "../../components/admin/CategoryForm";

const AdminCategoryEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setIsFetching(true);
        const res = await categoryService.getCategoryById(id);
        setCategory(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load category");
        navigate("/admin/categories");
      } finally {
        setIsFetching(false);
      }
    };

    fetchCategory();
  }, [id, navigate]);

  const handleSubmit = async (payload) => {
    try {
      setIsLoading(true);
      await categoryService.updateCategory(id, payload);
      toast.success("Category updated successfully");
      navigate("/admin/categories");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update category");
      throw err; // Re-throw to let form handle error state
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/categories");
  };

  if (isFetching) {
    return (
      <div className="container-page py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading category...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container-page py-8 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Category Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The category you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate("/admin/categories")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Categories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <CategoryForm
        category={category}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdminCategoryEditPage;
