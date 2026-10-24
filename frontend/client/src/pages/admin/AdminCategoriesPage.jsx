import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  CheckCircle,
  XCircle,
  Eye,
  ChevronRight,
  ChevronDown,
  Layers,
  Folder,
  FolderPlus,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { categoryService } from "../../services/categoryService";
import Button from "../../components/ui/Button";
import CategoryImageGalleryModal from "../../components/admin/CategoryImageGalleryModal";
import ConfirmActionModal from "../superadmin/ConfirmActionModal";

const AdminCategoriesPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";
  const basePath = isAdmin ? "/admin" : "/seller";

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [viewingCategory, setViewingCategory] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, category: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getCategories({ includeInactive: true });
      const data = res.data || [];
      setCategories(data);

      // Expand all level 1 categories by default
      const rootIds = new Set(data.filter((c) => (c.level || 1) === 1).map((c) => c._id));
      setExpandedNodes(rootIds);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpand = (id) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allParentIds = categories
      .filter((c) => (c.level || 1) < 3)
      .map((c) => c._id);
    setExpandedNodes(new Set(allParentIds));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const handleAdd = (parentId = "") => {
    if (parentId) {
      navigate(`${basePath}/categories/add?parent=${parentId}`);
    } else {
      navigate(`${basePath}/categories/add`);
    }
  };

  const handleEdit = (cat) => {
    if (!isAdmin) {
      toast.error("Only Administrators can modify category structure.");
      return;
    }
    navigate(`${basePath}/categories/${cat._id}/edit`);
  };

  const handleViewImage = (cat) => {
    setViewingCategory(cat);
    setIsGalleryOpen(true);
  };

  const handlePromptDelete = (cat) => {
    if (!isAdmin) {
      toast.error("Only Administrators can delete categories.");
      return;
    }
    setConfirmDeleteModal({ isOpen: true, category: cat });
  };

  const handleConfirmDelete = async () => {
    const { category } = confirmDeleteModal;
    if (!category) return;
    try {
      setIsDeleting(true);
      await categoryService.deleteCategory(category._id);
      toast.success(`Category "${category.name}" deleted successfully!`);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete category");
    } finally {
      setIsDeleting(false);
      setConfirmDeleteModal({ isOpen: false, category: null });
    }
  };

  // Map children by parent ID
  const childrenMap = useMemo(() => {
    const map = new Map();
    for (const cat of categories) {
      const pId = cat.parent?._id ? cat.parent._id.toString() : cat.parent ? cat.parent.toString() : "root";
      if (!map.has(pId)) map.set(pId, []);
      map.get(pId).push(cat);
    }
    return map;
  }, [categories]);

  // Build flattened ordered list for tree rendering
  const orderedTreeList = useMemo(() => {
    const result = [];

    const traverse = (parentId = "root", depth = 0) => {
      const children = childrenMap.get(parentId) || [];
      // Sort by displayOrder then name
      children.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0) || a.name.localeCompare(b.name));

      for (const item of children) {
        const hasChildren = (childrenMap.get(item._id.toString()) || []).length > 0;
        result.push({ ...item, depth, hasChildren });

        // If searching or node is expanded, traverse children
        if (search.trim() || expandedNodes.has(item._id)) {
          traverse(item._id.toString(), depth + 1);
        }
      }
    };

    traverse("root", 0);
    return result;
  }, [childrenMap, expandedNodes, search]);

  // Filter based on search and level tab
  const displayedCategories = useMemo(() => {
    let list = orderedTreeList;

    if (levelFilter !== "all") {
      const targetLevel = Number(levelFilter);
      list = categories.filter((c) => (c.level || 1) === targetLevel);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      list = categories.filter(
        (c) =>
          c.name?.toLowerCase().includes(s) ||
          c.slug?.toLowerCase().includes(s) ||
          (c.ancestors || []).some((a) => a.name?.toLowerCase().includes(s))
      );
    }

    return list;
  }, [orderedTreeList, categories, levelFilter, search]);

  const levelStats = useMemo(() => {
    const l1 = categories.filter((c) => (c.level || 1) === 1).length;
    const l2 = categories.filter((c) => (c.level || 1) === 2).length;
    const l3 = categories.filter((c) => (c.level || 1) === 3).length;
    return { all: categories.length, l1, l2, l3 };
  }, [categories]);

  const getLevelBadge = (level = 1) => {
    switch (level) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            L1 • Category
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
            L2 • Subcategory
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            L3 • Item
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <Layers size={22} className="text-[var(--accent)]" /> Categories Management
          </h1>
          <p className="mt-1 text-sm text-stone">
            Organize multi-level store hierarchy: Category (Level 1) → Subcategory (Level 2) → Item (Level 3)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => handleAdd()} className="flex items-center gap-2">
            <Plus size={16} /> Add Root Category
          </Button>
        </div>
      </div>

      {/* Control Bar: Tabs, Search & Tree Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-hairline bg-ivory p-4 dark:border-hairline-dark dark:bg-charcoal">
        {/* Level Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setLevelFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              levelFilter === "all"
                ? "bg-[var(--accent)] text-white"
                : "text-stone hover:bg-cream/40 dark:hover:bg-cream/10"
            }`}
          >
            All Levels ({levelStats.all})
          </button>
          <button
            onClick={() => setLevelFilter("1")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              levelFilter === "1"
                ? "bg-[var(--accent)] text-white"
                : "text-stone hover:bg-cream/40 dark:hover:bg-cream/10"
            }`}
          >
            Categories L1 ({levelStats.l1})
          </button>
          <button
            onClick={() => setLevelFilter("2")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              levelFilter === "2"
                ? "bg-[var(--accent)] text-white"
                : "text-stone hover:bg-cream/40 dark:hover:bg-cream/10"
            }`}
          >
            Subcategories L2 ({levelStats.l2})
          </button>
          <button
            onClick={() => setLevelFilter("3")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              levelFilter === "3"
                ? "bg-[var(--accent)] text-white"
                : "text-stone hover:bg-cream/40 dark:hover:bg-cream/10"
            }`}
          >
            Items L3 ({levelStats.l3})
          </button>
        </div>

        {/* Search and Tree Controls */}
        <div className="flex items-center gap-2">
          {levelFilter === "all" && !search.trim() && (
            <div className="flex items-center gap-1 mr-2">
              <button
                type="button"
                onClick={expandAll}
                className="text-[11px] font-semibold text-stone hover:text-ink px-2 py-1 rounded bg-cream/40 dark:bg-charcoal/50 border border-hairline dark:border-hairline-dark"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="text-[11px] font-semibold text-stone hover:text-ink px-2 py-1 rounded bg-cream/40 dark:bg-charcoal/50 border border-hairline dark:border-hairline-dark"
              >
                Collapse All
              </button>
            </div>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" size={15} />
            <input
              type="text"
              placeholder="Search by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-transparent pl-9 pr-3 py-1.5 text-xs outline-none focus:border-ink dark:border-hairline-dark dark:focus:border-cream"
            />
          </div>
        </div>
      </div>

      {/* Main Content Table */}
      {loading ? (
        <div className="py-16 text-center text-sm text-stone flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-stone border-t-[var(--accent)] rounded-full animate-spin" />
          <span>Loading categories hierarchy...</span>
        </div>
      ) : displayedCategories.length === 0 ? (
        <div className="rounded-xl border border-hairline p-12 text-center text-stone dark:border-hairline-dark">
          <Tag className="mx-auto mb-3 text-stone" size={32} />
          <p className="font-medium text-ink dark:text-cream">No categories found</p>
          <p className="mt-1 text-xs text-stone">
            {search
              ? "Try adjusting your search query."
              : "Get started by adding your first root category."}
          </p>
          {!search && (
            <Button onClick={() => handleAdd()} className="mt-4 inline-flex items-center gap-1.5">
              <Plus size={15} /> Add Category
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-hairline bg-ivory dark:border-hairline-dark dark:bg-charcoal shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="border-b border-hairline bg-cream/30 text-xs font-semibold uppercase text-stone dark:border-hairline-dark dark:bg-charcoal/60">
              <tr>
                <th className="px-6 py-3.5">Category Structure & Name</th>
                <th className="px-4 py-3.5">Level</th>
                <th className="px-4 py-3.5">Slug</th>
                <th className="px-4 py-3.5 text-center">Order</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline dark:divide-hairline-dark">
              {displayedCategories.map((cat) => {
                const depth = levelFilter === "all" && !search.trim() ? cat.depth || 0 : 0;
                const hasChildren = cat.hasChildren;
                const isExpanded = expandedNodes.has(cat._id);
                const level = cat.level || 1;

                return (
                  <tr
                    key={cat._id}
                    className="hover:bg-cream/30 dark:hover:bg-cream/5 transition-colors group"
                  >
                    {/* Category Hierarchy & Name */}
                    <td className="px-6 py-3 font-medium">
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${depth * 28}px` }}
                      >
                        {/* Tree Branch Indicator */}
                        {depth > 0 && (
                          <span className="text-stone/40 select-none font-mono text-xs">└──</span>
                        )}

                        {/* Expand/Collapse Toggle */}
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(cat._id)}
                            className="p-1 rounded hover:bg-cream/60 dark:hover:bg-cream/10 text-stone hover:text-ink transition-colors"
                            title={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </button>
                        ) : (
                          <span className="w-5" />
                        )}

                        {/* Thumbnail / Icon */}
                        {cat.image?.url ? (
                          <img
                            src={cat.image.url}
                            alt={cat.name}
                            className="h-9 w-9 rounded-lg object-cover border border-hairline shrink-0"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-cream/40 dark:bg-charcoal/60 border border-hairline flex items-center justify-center text-stone shrink-0">
                            <Folder size={16} />
                          </div>
                        )}

                        {/* Name and Ancestry Trail */}
                        <div className="flex flex-col">
                          <span className="font-semibold text-ink dark:text-cream text-sm">
                            {cat.name}
                          </span>
                          {cat.ancestors && cat.ancestors.length > 0 && (
                            <span className="text-[11px] text-stone flex items-center gap-1 font-normal">
                              {cat.ancestors.map((a, i) => (
                                <span key={a._id} className="flex items-center gap-1">
                                  {a.name} <ArrowRight size={10} className="text-stone/60" />
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Level Badge */}
                    <td className="px-4 py-3 shrink-0">{getLevelBadge(level)}</td>

                    {/* Slug */}
                    <td className="px-4 py-3 text-stone font-mono text-xs max-w-xs truncate">
                      {cat.slug}
                    </td>

                    {/* Display Order */}
                    <td className="px-4 py-3 text-center text-xs text-stone font-mono">
                      {cat.displayOrder || 0}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {cat.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle size={13} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-stone">
                          <XCircle size={13} /> Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Add Subcategory or Item */}
                        {level < 3 && (
                          <button
                            type="button"
                            onClick={() => handleAdd(cat._id)}
                            className="hidden sm:inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-bg)] transition-colors border border-transparent hover:border-[var(--accent)]/30"
                            title={level === 1 ? "Add Subcategory under this category" : "Add Item under this subcategory"}
                          >
                            <Plus size={13} />
                            {level === 1 ? "Add Subcategory" : "Add Item"}
                          </button>
                        )}

                        {/* View Image */}
                        {cat.image?.url && (
                          <button
                            onClick={() => handleViewImage(cat)}
                            className="rounded-lg p-1.5 text-stone hover:bg-ink/5 hover:text-blue-500 dark:hover:bg-cream/10 dark:hover:text-blue-400 transition-colors"
                            title="View Image"
                          >
                            <Eye size={15} />
                          </button>
                        )}

                        {/* Edit & Delete (Admin Only) */}
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => handleEdit(cat)}
                              className="rounded-lg p-1.5 text-stone hover:bg-ink/5 hover:text-ink dark:hover:bg-cream/10 dark:hover:text-cream transition-colors cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit2 size={15} />
                            </button>

                            <button
                              onClick={() => handlePromptDelete(cat)}
                              className="rounded-lg p-1.5 text-stone hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        ) : (
                          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            Admin Managed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      {/* Category Deletion Confirmation Modal */}
      <ConfirmActionModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={() => setConfirmDeleteModal({ isOpen: false, category: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Catalog Category"
        message={
          confirmDeleteModal.category
            ? `Are you sure you want to delete category "${confirmDeleteModal.category.name}"?\n\nNote: If this category contains child subcategories/items or has active products assigned, deletion will be safely blocked.`
            : ""
        }
        confirmText="Delete Category"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default AdminCategoriesPage;