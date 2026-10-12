import { IndustryService } from './industry.service.js';
import {
  AUSTRALIAN_STATES,
  STATE_NAME_TO_CODE,
  normalizeAndValidateState,
} from './industry.dto.js';

export {
  AUSTRALIAN_STATES,
  STATE_NAME_TO_CODE,
  normalizeAndValidateState,
};

export const getAllIndustriesController = async (req, res, next) => {
  try {
    const { industries, pagination } = await IndustryService.getAllIndustries(req.query, req.user);
    if (pagination) {
      return res.status(200).json({
        success: true,
        data: industries,
        pagination,
      });
    }
    res.status(200).json({
      success: true,
      data: industries,
    });
  } catch (error) {
    next(error);
  }
};

export const createIndustryController = async (req, res, next) => {
  try {
    const industry = await IndustryService.createIndustry(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Industry created successfully',
      data: industry,
    });
  } catch (error) {
    if (error.missingFields) {
      return res.status(400).json({
        success: false,
        message: error.message,
        missingFields: error.missingFields,
      });
    }
    next(error);
  }
};

export const updateIndustryController = async (req, res, next) => {
  try {
    const industry = await IndustryService.updateIndustry(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Industry updated successfully',
      data: industry,
    });
  } catch (error) {
    next(error);
  }
};

export const getIndustryStatsController = async (req, res, next) => {
  try {
    const stats = await IndustryService.getIndustryStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyIndustriesController = async (req, res, next) => {
  try {
    const data = await IndustryService.getMyIndustries(req.user);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteIndustryController = async (req, res, next) => {
  try {
    await IndustryService.deleteIndustry(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Industry and all associated workflow records deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
