import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { productService } from "../../services/productService";
import { adminProductService } from "../../services/adminProductService";
import ProductForm from "../../components/admin/ProductForm";

const AdminProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsFetching(true);
        const res = await productService.getProductById(id);
        const loadedProduct = res.data.product || res.data;

        // If logged-in user is a seller, enforce tenant ownership
        if (user?.role === "seller") {
          const sellerId = loadedProduct.seller?._id || loadedProduct.seller;
          if (!sellerId || sellerId.toString() !== user._id.toString()) {
            toast.error("You do not have permission to edit another seller's product.");
            navigate("/seller/products");
            return;
          }
        }

        setProduct(loadedProduct);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load product");
        navigate("/seller/products");
      } finally {
        setIsFetching(false);
      }
    };

    fetchProduct();
  }, [id, navigate, user]);

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      await adminProductService.updateProduct(id, formData);
      toast.success("Product updated successfully");
      navigate("/seller/products");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update product");
      throw err; // Re-throw to let form handle error state
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/seller/products");
  };

  if (isFetching) {
    return (
      <div className="max-w-5xl mx-auto py-2 sm:py-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto py-2 sm:py-6 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The product you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate("/seller/products")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-6">
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