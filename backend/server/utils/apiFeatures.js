class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  search() {
    if (this.queryString.search) {
      const searchPattern = this.queryString.search.trim();
      const escapedPattern = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const keywordParts = searchPattern
        .split(/[\s,]+/)
        .map((part) => part.trim())
        .filter(Boolean);

      const orConditions = [
        { title: { $regex: escapedPattern, $options: "i" } },
        { description: { $regex: escapedPattern, $options: "i" } },
        { lyId: { $regex: escapedPattern, $options: "i" } },
        { hsnNumber: { $regex: escapedPattern, $options: "i" } },
        { gstRate: { $regex: escapedPattern, $options: "i" } },
        { searchKeyword: { $regex: escapedPattern, $options: "i" } },
        { tags: { $regex: escapedPattern, $options: "i" } },
      ];

      keywordParts.forEach((part) => {
        const escapedPart = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        orConditions.push({ title: { $regex: escapedPart, $options: "i" } });
        orConditions.push({ searchKeyword: { $regex: escapedPart, $options: "i" } });
        orConditions.push({ tags: { $regex: escapedPart, $options: "i" } });
      });

      this.query = this.query.find({ $or: orConditions });
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = [
      "page",
      "sort",
      "limit",
      "fields",
      "search",
      "__p",
      "path",
      "path*",
      "includeInactive",
    ];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Also remove any parameter starting with __ or utm_ or ref
    Object.keys(queryObj).forEach((key) => {
      if (key.startsWith("__") || key.startsWith("utm_") || key === "ref" || key === "_") {
        delete queryObj[key];
      }
    });

    if (queryObj.category) {
      const catId = queryObj.category;
      delete queryObj.category;
      this.query = this.query.find({
        $or: [{ categoryPath: catId }, { category: catId }],
      });
    }

    if (queryObj.brand) {
      this.query = this.query.find({ brand: queryObj.brand });
      delete queryObj.brand;
    }

    if (queryObj.minPrice || queryObj.maxPrice) {
      const priceFilter = {};
      if (queryObj.minPrice !== undefined && queryObj.minPrice !== "") {
        priceFilter.$gte = Number(queryObj.minPrice);
      }
      if (queryObj.maxPrice !== undefined && queryObj.maxPrice !== "") {
        priceFilter.$lte = Number(queryObj.maxPrice);
      }
      delete queryObj.minPrice;
      delete queryObj.maxPrice;
      if (Object.keys(priceFilter).length > 0) {
        this.query = this.query.find({ price: priceFilter });
      }
    }

    if (queryObj.minRating) {
      const ratingVal = Number(queryObj.minRating);
      delete queryObj.minRating;
      if (!Number.isNaN(ratingVal)) {
        this.query = this.query.find({ ratingsAverage: { $gte: ratingVal } });
      }
    }

    // Only allow known Product schema fields in the generic query object
    const allowedFilterFields = new Set([
      "isFeatured",
      "isNewArrival",
      "isTrending",
      "color",
      "tags",
    ]);

    Object.keys(queryObj).forEach((key) => {
      if (!allowedFilterFields.has(key)) {
        delete queryObj[key];
      } else if (queryObj[key] === undefined || queryObj[key] === "") {
        delete queryObj[key];
      }
    });

    if (Object.keys(queryObj).length > 0) {
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(/(?<!\$)\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
      this.query = this.query.find(JSON.parse(queryStr));
    }

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortMap = {
        "price-asc": "price",
        "price-desc": "-price",
        newest: "-createdAt",
        oldest: "createdAt",
        "rating-desc": "-ratingsAverage",
        popular: "-numSold",
      };
      const sortBy = sortMap[this.queryString.sort] || this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 12;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit };
    return this;
  }
}

module.exports = ApiFeatures;
