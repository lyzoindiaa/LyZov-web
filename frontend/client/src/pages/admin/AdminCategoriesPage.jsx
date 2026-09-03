import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Tag, CheckCircle, XCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { categoryService } from "../../services/categoryService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import CategoryImageGalleryModal from "../../components/admin/CategoryImageGalleryModal";

const AdminCategoriesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewingCategory, setViewingCategory] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getCategories();
      setCategories(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = () => {
    navigate("/admin/categories/add");
  };

  const handleEdit = (cat) => {
    navigate(`/admin/categories/${cat._id}/edit`);
  };

  const handleViewImage = (cat) => {
    setViewingCategory(cat);
    setIsGalleryOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await categoryService.deleteCategory(id);
      toast.success("Category deleted successfully!");
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete category");
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Categories Table</h1>
          <p className="mt-1 text-sm text-stone">Manage store categories, slugs, and display states</p>
        </div>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus size={16} /> Add Category
        </Button>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-hairline bg-ivory p-4 dark:border-hairline-dark dark:bg-charcoal">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" size={16} />
          <input
            type="text"
            placeholder="Search category by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-transparent pl-9 pr-4 py-2 text-sm outline-none focus:border-ink dark:border-hairline-dark dark:focus:border-cream"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-stone">Loading categories table...</div>
      ) : filteredCategories.length === 0 ? (
        <div className="rounded-xl border border-hairline p-12 text-center text-stone dark:border-hairline-dark">
          <Tag className="mx-auto mb-3 text-stone" size={32} />
          <p className="font-medium">No categories found</p>
          <p className="mt-1 text-xs">Create your first category using the button above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-hairline bg-ivory dark:border-hairline-dark dark:bg-charcoal">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-hairline bg-cream/40 text-xs font-semibold uppercase text-stone dark:border-hairline-dark dark:bg-charcoal/50">
              <tr>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline dark:divide-hairline-dark">
              {filteredCategories.map((cat) => (
                <tr key={cat._id} className="hover:bg-cream/20 dark:hover:bg-cream/5">
                  <td className="px-6 py-4 font-medium">
                    <div className="flex items-center gap-3">
                      <img
                        src={cat.image?.url || "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800"}
                        alt={cat.name}
                        className="h-10 w-10 rounded-lg object-cover border border-hairline"
                      />
                      <span>{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-stone font-mono text-xs">{cat.slug}</td>
                  <td className="px-6 py-4 text-stone max-w-xs truncate">{cat.description || "â€”"}</td>
                  <td className="px-6 py-4">
                    {cat.isActive !== false ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle size={14} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-stone">
                        <XCircle size={14} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewImage(cat)}
                        className="rounded-lg p-2 text-stone hover:bg-ink/5 hover:text-blue-500 dark:hover:bg-cream/10 dark:hover:text-blue-400"
                        title="View Image"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(cat)}
                        className="rounded-lg p-2 text-stone hover:bg-ink/5 hover:text-ink dark:hover:bg-cream/10 dark:hover:text-cream"
                        title="Edit Category"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id)}
                        className="rounded-lg p-2 text-stone hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Image Gallery Modal */}
      <CategoryImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        category={viewingCategory}
      />
    </div>
  );
};

export default AdminCategoriesPage;