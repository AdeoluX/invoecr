class BaseRepository {
  constructor(model) {
    if (!model) throw new Error('Model is required');
    this.model = model;
  }

  // Create a new document
  async create(data) {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  // Find all documents with sorting and selection
  async findAll({
    query = {},
    select = null,
    sort = null,
    populate = null,
  } = {}) {
    try {
      let queryBuilder = this.model.find(query);
  
      if (select) {
        queryBuilder = queryBuilder.select(select);
      }
  
      if (sort) {
        queryBuilder = queryBuilder.sort(sort);
      }
  
      if (populate) {
        queryBuilder = queryBuilder.populate(populate);
      }
  
      return await queryBuilder.exec();
    } catch (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }
  }  

  // Paginate documents with sorting, selection, and population
  async paginate({
    query = {},
    page = 1,
    limit = 10,
    select = null,
    sort = null,
    populate = null,
  } = {}) {
    try {
      const skip = (page - 1) * limit;
      let queryBuilder = this.model.find(query);

      if (select) {
        queryBuilder = queryBuilder.select(select);
      }

      if (sort) {
        queryBuilder = queryBuilder.sort(sort);
      }

      if (populate) {
        queryBuilder = queryBuilder.populate(populate);
      }

      queryBuilder = queryBuilder.skip(skip).limit(limit);

      const documents = await queryBuilder.exec();
      const total = await this.model.countDocuments(query);

      return {
        data: documents,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
          hasNextPage: Number(page) < Math.ceil(total / limit),
          hasPrevPage: Number(page) > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to paginate documents: ${error.message}`);
    }
  }

  async countDocuments(query = {}) {
    try {
      return await this.model.countDocuments(query).exec();
    } catch (error) {
      throw new Error(`Failed to count documents: ${error.message}`);
    }
  }

  // New: Aggregate method to support MongoDB aggregation pipelines
  async aggregate(pipeline) {
    try {
      return await this.model.aggregate(pipeline).exec();
    } catch (error) {
      throw new Error(`Failed to execute aggregation: ${error.message}`);
    }
  }

  async findOne({ query = {}, select = null, sort = null, populate = null } = {}) {
    try {
      let queryBuilder = this.model.findOne(query);
  
      if (select) queryBuilder = queryBuilder.select(select);
      if (sort) queryBuilder = queryBuilder.sort(sort);
      if (populate) queryBuilder = queryBuilder.populate(populate);
  
      const document = await queryBuilder.exec();
      return document;
    } catch (error) {
      throw new Error(`Failed to find document: ${error.message}`);
    }
  }

  async findById(id, select = null) {
    try {
      let query = this.model.findById(id);
      if (select) {
        query = query.select(select);
      }
      const document = await query.exec();
      return document;
    } catch (error) {
      throw new Error(`Failed to find document: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      const document = await this.model.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      return document;
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const document = await this.model.findByIdAndDelete(id);
      return document;
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  async insertMany(dataArray, options = {}) {
    try {
      if (!Array.isArray(dataArray)) {
        throw new Error('Data must be an array');
      }
      return await this.model.insertMany(dataArray, options);
    } catch (error) {
      throw new Error(`Failed to insert documents: ${error.message}`);
    }
  }

  async seed(dataArray) {
    try {
      await this.model.deleteMany({});
      const seededDocuments = await this.model.insertMany(dataArray);
      return seededDocuments;
    } catch (error) {
      throw new Error(`Failed to seed database: ${error.message}`);
    }
  }
}

module.exports = BaseRepository;