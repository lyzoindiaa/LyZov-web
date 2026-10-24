import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Plus, Pencil, Trash2, Award, Shield } from "lucide-react";
import { toast } from "react-toastify";
import { adminBrandService } from "../../services/adminBrandService";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import ConfirmActionModal from "../superadmin/ConfirmActionModal";

const AdminBrandsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";

  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, brand: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBrands = async () => {
    setIsLoading(true);
    try {
      const res = await adminBrandService.getBrands({ all: "true" });
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
    if (!isAdmin) {
      toast.error("Only Administrators can modify brand details.");
      return;
    }
    setEditingBrand(brand);
    setName(brand.name);
    setDescription(brand.description || "");
    setIsModalOpen(true);
  };

  const handlePromptDelete = (brand) => {
    if (!isAdmin) {
      toast.error("Only Administrators can delete catalog brands.");
      return;
    }
    setConfirmDeleteModal({ isOpen: true, brand });
  };

  const handleConfirmDelete = async () => {
    const { brand } = confirmDeleteModal;
    if (!brand) return;
    setIsDeleting(true);
    try {
      await adminBrandService.deleteBrand(brand._id);
      toast.success(`Brand "${brand.name}" deleted successfully`);
      loadBrands();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete brand");
    } finally {
      setIsDeleting(false);
      setConfirmDeleteModal({ isOpen: false, brand: null });
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
        await adminBrandService.updateBrand(editingBrand._id, { name: name.trim(), description: description.trim() });
        toast.success("Brand updated successfully");
      } else {
        await adminBrandService.createBrand({ name: name.trim(), description: description.trim() });
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
                    {isAdmin ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="Edit Brand"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handlePromptDelete(brand)}
                          className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete Brand"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        Admin Managed
                      </span>
                    )}
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

      {/* Brand Deletion Confirmation Modal */}
      <ConfirmActionModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={() => setConfirmDeleteModal({ isOpen: false, brand: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Catalog Brand"
        message={
          confirmDeleteModal.brand
            ? `Are you sure you want to delete brand "${confirmDeleteModal.brand.name}"?\n\nIf any products in the marketplace are currently associated with this brand, deletion will be blocked by system integrity rules.`
            : ""
        }
        confirmText="Delete Brand"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default AdminBrandsPage;