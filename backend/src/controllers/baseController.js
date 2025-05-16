// src/controllers/baseController.js
const { AppError } = require('../utils/errorHandler');

/**
 * 控制器基类，提供通用的CRUD操作
 */
class BaseController {
  /**
   * 构造函数
   * @param {mongoose.Model} model Mongoose模型
   */
  constructor(model) {
    this.model = model;
  }
  
  /**
   * 创建资源
   */
  create = async (req, res, next) => {
    try {
      const doc = await this.model.create(req.body);
      
      res.status(201).json({
        success: true,
        message: req.__('success.saved'),
        data: doc
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 获取资源列表
   */
  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 20, sort = '-createdAt', ...filters } = req.query;
      
      const query = this.buildFilterQuery(filters);
      
      const [docs, total] = await Promise.all([
        this.model
          .find(query)
          .sort(sort)
          .limit(parseInt(limit))
          .skip((parseInt(page) - 1) * parseInt(limit)),
        this.model.countDocuments(query)
      ]);
      
      res.json({
        success: true,
        data: docs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 获取单个资源
   */
  getOne = async (req, res, next) => {
    try {
      const doc = await this.model.findById(req.params.id);
      
      if (!doc) {
        return next(new AppError(req.__('error.not_found'), 404, 'not_found'));
      }
      
      res.json({
        success: true,
        data: doc
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 更新资源
   */
  update = async (req, res, next) => {
    try {
      const doc = await this.model.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      
      if (!doc) {
        return next(new AppError(req.__('error.not_found'), 404, 'not_found'));
      }
      
      res.json({
        success: true,
        message: req.__('success.saved'),
        data: doc
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 删除资源
   */
  delete = async (req, res, next) => {
    try {
      const doc = await this.model.findByIdAndDelete(req.params.id);
      
      if (!doc) {
        return next(new AppError(req.__('error.not_found'), 404, 'not_found'));
      }
      
      res.json({
        success: true,
        message: req.__('success.deleted'),
        data: null
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 构建过滤查询
   * @param {Object} filters 过滤条件
   * @returns {Object} Mongoose查询对象
   */
  buildFilterQuery(filters) {
    const query = {};
    
    // 处理基本过滤条件
    Object.keys(filters).forEach(key => {
      query[key] = filters[key];
    });
    
    return query;
  }
}

module.exports = BaseController;