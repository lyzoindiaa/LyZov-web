import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Award } from "lucide-react";
import { toast } from "react-toastify";
import { adminBrandService } from "../../services/adminBrandService";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";

const AdminBrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBrands = async () => {
    setIsLoading(true);
    try {
      const res = await adminBrandService.getBrands();
      setBrands(res.data || []);
    } catch {
      setBrands([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleAdd = () => {
    setEditingBrand(null);
    setName("");
    setDescription("");
    setIsModalOpen(true);
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setDescription(brand.description || "");
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this brand? Action cannot be undone.")) return;
    try {
      await adminBrandService.deleteBrand(id);
      toast.success("Brand deleted successfully");
      loadBrands();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete brand");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Brand name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingBrand) {
        await adminBrandService.updateBrand(editingBrand._id, { name, description });
        toast.success("Brand updated successfully");
      } else {
        await adminBrandService.createBrand({ name, description });
        toast.success("Brand created successfully");
      }
      loadBrands();
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save brand");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow">Catalog Management</span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Brands
          </h1>
        </div>
        <Button icon={Plus} onClick={handleAdd}>
          Add Brand
        </Button>
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wide text-gray-400">
              <th className="px-5 py-4">Brand Name</th>
              <th className="px-5 py-4">Description</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                  Loading brands...
                </td>
              </tr>
            ) : brands.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                  No brands found. Click "Add Brand" above to create one.
                </td>
              </tr>
            ) : (
              brands.map((brand) => (
                <tr key={brand._id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="flex items-center gap-2.5 px-5 py-4 font-semibold text-gray-900 dark:text-white">
                    <Award size={16} className="text-amber-500" />
                    {brand.name}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
                    {brand.description || "â€”"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleEdit(brand)}
                        className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(brand._id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBrand ? "Edit Brand" : "Add New Brand"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Brand Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. LyZov Essentials, CultFit, Nike"
            required
          />

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description about the brand..."
            />
          </div>

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            {editingBrand ? "Save Changes" : "Create Brand"}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminBrandsPage;