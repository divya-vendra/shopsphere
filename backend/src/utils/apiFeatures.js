/**
 * APIFeatures — chainable query builder for filtering, sorting, field
 * limiting, searching, and pagination.
 *
 * Design: receives a Mongoose Query and the raw req.query object.
 * Each method mutates the internal query and returns `this` for chaining.
 *
 * Usage in a controller:
 *   const features = new APIFeatures(Product.find(), req.query)
 *     .search()
 *     .filter()
 *     .sort()
 *     .limitFields()
 *     .paginate();
 *   const products = await features.query;
 */
class APIFeatures {
  constructor(query, queryString) {
    this.query       = query;
    this.queryString = queryString;
  }

  // ── Full-text search via MongoDB $text index ─────────────────────────────
  search() {
    if (this.queryString.search) {
      this.query = this.query.find({
        $text: { $search: this.queryString.search },
      });
    }
    return this;
  }

  // ── Filtering ─────────────────────────────────────────────────────────────
  // Supports: ?category=Electronics&price[gte]=100&price[lte]=500
  // Converts gte/gt/lte/lt to MongoDB operators by prepending '$'.
  // Strips empty string params (including nested e.g. price[gte]=) so they don't filter.
  filter() {
    const queryObj = { ...this.queryString };
    const excluded = ['page', 'sort', 'limit', 'fields', 'search'];
    excluded.forEach((el) => delete queryObj[el]);

    // Remove empty/falsy values; for nested objects (e.g. price) remove empty keys
    const clean = (obj) => {
      Object.keys(obj).forEach((key) => {
        const val = obj[key];
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
          clean(val);
          if (Object.keys(val).length === 0) delete obj[key];
        } else if (val === '' || val === undefined || val === null) {
          delete obj[key];
        }
      });
    };
    clean(queryObj);

    // Replace gte/gt/lte/lt with $gte/$gt/$lte/$lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  // ── Sorting ───────────────────────────────────────────────────────────────
  // ?sort=price → ascending. ?sort=-price → descending.
  // Multiple fields: ?sort=-price,ratings
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt'); // default: newest first
    }
    return this;
  }

  // ── Field limiting ────────────────────────────────────────────────────────
  // ?fields=name,price,category → only return those fields
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // exclude internal Mongoose field
    }
    return this;
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  // ?page=2&limit=12 → skip 12 docs, return next 12
  paginate() {
    const page  = Math.max(1, parseInt(this.queryString.page, 10)  || 1);
    const limit = Math.min(100, parseInt(this.queryString.limit, 10) || 12);
    const skip  = (page - 1) * limit;

    this.query      = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit, skip };
    return this;
  }
}

module.exports = APIFeatures;
