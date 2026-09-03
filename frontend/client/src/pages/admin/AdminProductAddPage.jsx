import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { adminProductService } from "../../services/adminProductService";
import ProductForm from "../../components/admin/ProductForm";

const AdminProductAddPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      await adminProductService.createProduct(formData);
      toast.success("Product created successfully");
      navigate("/admin/products");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create product");
      throw err; // Re-throw to let form handle error state
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/products");
  };

  return (
    <div className="container-page py-8">
      <ProductForm
        product={null}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdminProductAddPage;