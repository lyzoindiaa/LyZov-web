import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { productService } from "../../services/productService";
import { adminProductService } from "../../services/adminProductService";
import ProductForm from "../../components/admin/ProductForm";

const AdminProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsFetching(true);
        const res = await productService.getProductById(id);
        setProduct(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load product");
        navigate("/admin/products");
      } finally {
        setIsFetching(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      await adminProductService.updateProduct(id, formData);
      toast.success("Product updated successfully");
      navigate("/admin/products");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update product");
      throw err; // Re-throw to let form handle error state
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/products");
  };

  if (isFetching) {
    return (
      <div className="container-page py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-page py-8 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The product you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate("/admin/products")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <ProductForm
        product={product}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdminProductEditPage;