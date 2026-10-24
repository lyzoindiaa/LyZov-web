const Category = require("../models/Category");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");
const slugify = require("slugify");

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

/**
 * Builds a nested hierarchical tree from a flat list of category documents.
 */
const buildTree = (categories, parentId = null) => {
  return categories
    .filter((cat) => {
      const p = cat.parent?._id ? cat.parent._id.toString() : cat.parent ? cat.parent.toString() : null;
      return p === (parentId ? parentId.toString() : null);
    })
    .map((cat) => {
      const doc = cat.toObject ? cat.toObject() : { ...cat };
      const children = buildTree(categories, doc._id);
      return {
        ...doc,
        children,
      };
    });
};

/**
 * Recursively updates ancestors and level for all descendants of a category.
 */
const updateDescendantAncestors = async (parentCategory) => {
  const children = await Category.find({ parent: parentCategory._id });
  for (const child of children) {
    child.level = Math.min((parentCategory.level || 1) + 1, 3);
    child.ancestors = [
      ...(parentCategory.ancestors || []),
      {
        _id: parentCategory._id,
        name: parentCategory.name,
        slug: parentCategory.slug,
        level: parentCategory.level || 1,
      },
    ];
    await child.save();
    await updateDescendantAncestors(child);
  }
};

// @desc    Get all categories (flat or tree)
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.includeInactive !== "true") {
    query.isActive = true;
  }

  if (req.query.level) {
    query.level = Number(req.query.level);
  }

  if (req.query.parent !== undefined) {
    if (req.query.parent === "null" || req.query.parent === "" || req.query.parent === null) {
      query.parent = null;
    } else if (isValidObjectId(req.query.parent)) {
      query.parent = req.query.parent;
    }
  }

  const categories = await Category.find(query)
    .populate("parent", "name slug level")
    .sort("displayOrder name");

  // If tree representation is requested
  if (req.query.tree === "true") {
    // If a filter like level was applied, fetch all active categories to construct the tree
    const allForTree = Object.keys(query).length > (query.isActive !== undefined ? 1 : 0)
      ? await Category.find(query.isActive !== undefined ? { isActive: query.isActive } : {})
          .populate("parent", "name slug level")
          .sort("displayOrder name")
      : categories;

    const tree = buildTree(allForTree);
    return sendSuccess(res, 200, "Category tree fetched successfully", tree);
  }

  return sendSuccess(res, 200, "Categories fetched successfully", categories);
});

// @desc    Get category tree
// @route   GET /api/categories/tree
// @access  Public
const getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .populate("parent", "name slug level")
    .sort("displayOrder name");

  const tree = buildTree(categories);
  return sendSuccess(res, 200, "Category tree fetched successfully", tree);
});

// @desc    Get single category by slug or id
// @route   GET /api/categories/:slug
// @access  Public
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const identifier = req.params.slug;
  const identifierQuery = isValidObjectId(identifier)
    ? { $or: [{ slug: identifier }, { _id: identifier }] }
    : { slug: identifier };

  const category = await Category.findOne({ ...identifierQuery, isActive: true })
    .populate("parent", "name slug level");

  if (!category) throw ApiError.notFound("Category not found");

  // Fetch immediate children
  const children = await Category.find({ parent: category._id, isActive: true })
    .sort("displayOrder name");

  return sendSuccess(res, 200, "Category fetched successfully", {
    ...category.toObject(),
    children,
  });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Seller
const createCategory = asyncHandler(async (req, res) => {
  let image = { url: "", publicId: "" };
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, "novacart/categories");
    image = { url: result.secure_url, publicId: result.public_id };
  }

  const { name, description, parent, displayOrder, isActive } = req.body;
  let level = 1;
  let ancestors = [];
  let parentId = null;

  if (parent && parent !== "null" && parent !== "") {
    if (!isValidObjectId(parent)) {
      throw ApiError.badRequest("Invalid parent category ID");
    }

    const parentDoc = await Category.findById(parent);
    if (!parentDoc) {
      throw ApiError.notFound("Parent category not found");
    }

    if (parentDoc.level >= 3) {
      throw ApiError.badRequest("Cannot create subcategories under an Item (maximum 3 levels reached: Category → Subcategory → Item)");
    }

    parentId = parentDoc._id;
    level = (parentDoc.level || 1) + 1;
    ancestors = [
      ...(parentDoc.ancestors || []),
      {
        _id: parentDoc._id,
        name: parentDoc.name,
        slug: parentDoc.slug,
        level: parentDoc.level || 1,
      },
    ];
  }

  const trimmedName = (name || "").trim();
  if (!trimmedName) throw ApiError.badRequest("Category name is required");

  const existingCategory = await Category.findOne({
    parent: parentId,
    name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
  });
  if (existingCategory) {
    throw ApiError.badRequest(
      `A category named "${trimmedName}" already exists under this ${parentId ? "parent" : "root level"}.`
    );
  }

  // Ensure unique slug
  let baseSlug = slugify(trimmedName, { lower: true, strict: true });
  if (parentId && ancestors.length > 0) {
    baseSlug = `${ancestors[ancestors.length - 1].slug}-${baseSlug}`;
  }
  let slug = baseSlug;
  let count = 1;
  while (await Category.exists({ slug })) {
    slug = `${baseSlug}-${count++}`;
  }

  const category = await Category.create({
    name,
    slug,
    description: description || "",
    image,
    parent: parentId,
    ancestors,
    level,
    displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
    isActive: isActive !== undefined ? isActive === "true" || isActive === true : true,
  });

  return sendSuccess(res, 201, "Category created successfully", category);
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Seller
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound("Category not found");

  if (req.file) {
    if (category.image?.publicId) await deleteFromCloudinary(category.image.publicId);
    const result = await uploadToCloudinary(req.file.buffer, "novacart/categories");
    category.image = { url: result.secure_url, publicId: result.public_id };
  }

  const { name, description, parent, displayOrder, isActive } = req.body;

  if (description !== undefined) category.description = description;
  if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);
  if (isActive !== undefined) category.isActive = isActive === "true" || isActive === true;

  // Check if name changed -> update slug
  let nameChanged = false;
  if (name && name.trim() !== category.name) {
    category.name = name.trim();
    nameChanged = true;
  }

  // Check if parent changed
  let parentChanged = false;
  if (parent !== undefined) {
    const targetParentId = parent === "null" || parent === "" || !parent ? null : parent;

    const currentParentId = category.parent ? category.parent.toString() : null;
    const nextParentId = targetParentId ? targetParentId.toString() : null;

    if (currentParentId !== nextParentId) {
      if (nextParentId === category._id.toString()) {
        throw ApiError.badRequest("A category cannot be its own parent");
      }

      if (nextParentId) {
        if (!isValidObjectId(nextParentId)) {
          throw ApiError.badRequest("Invalid parent category ID");
        }

        const parentDoc = await Category.findById(nextParentId);
        if (!parentDoc) throw ApiError.notFound("Parent category not found");

        // Prevent cycle: new parent cannot have current category in its ancestors
        const isDescendant = (parentDoc.ancestors || []).some(
          (a) => a._id.toString() === category._id.toString()
        );
        if (isDescendant) {
          throw ApiError.badRequest("Cannot move a category under one of its own subcategories");
        }

        if (parentDoc.level >= 3) {
          throw ApiError.badRequest("Cannot create subcategories under an Item (maximum 3 levels reached)");
        }

        category.parent = parentDoc._id;
        category.level = (parentDoc.level || 1) + 1;
        category.ancestors = [
          ...(parentDoc.ancestors || []),
          {
            _id: parentDoc._id,
            name: parentDoc.name,
            slug: parentDoc.slug,
            level: parentDoc.level || 1,
          },
        ];
      } else {
        category.parent = null;
        category.level = 1;
        category.ancestors = [];
      }
      parentChanged = true;
    }
  }

  // If name or parent changed, update slug
  if (nameChanged || parentChanged) {
    let baseSlug = slugify(category.name, { lower: true, strict: true });
    if (category.parent && category.ancestors && category.ancestors.length > 0) {
      baseSlug = `${category.ancestors[category.ancestors.length - 1].slug}-${baseSlug}`;
    }
    let slug = baseSlug;
    let count = 1;
    while (await Category.exists({ slug, _id: { $ne: category._id } })) {
      slug = `${baseSlug}-${count++}`;
    }
    category.slug = slug;
  }

  await category.save();

  // If parent or name changed, cascade update all descendants
  if (parentChanged || nameChanged) {
    await updateDescendantAncestors(category);
  }

  return sendSuccess(res, 200, "Category updated successfully", category);
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Seller
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound("Category not found");

  // Check if has children
  const hasChildren = await Category.exists({ parent: category._id });
  if (hasChildren) {
    throw ApiError.badRequest(
      "Cannot delete a category that has subcategories or items. Please reassign or delete its child categories first."
    );
  }

  // Check if has products assigned
  const hasProducts = await Product.exists({
    $or: [{ category: category._id }, { categoryPath: category._id }],
  });
  if (hasProducts) {
    throw ApiError.badRequest(
      "Cannot delete a category that is associated with products. Please reassign or remove the products first."
    );
  }

  if (category.image?.publicId) await deleteFromCloudinary(category.image.publicId);
  await category.deleteOne();

  return sendSuccess(res, 200, "Category deleted successfully");
});

module.exports = {
  getCategories,
  getCategoryTree,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
