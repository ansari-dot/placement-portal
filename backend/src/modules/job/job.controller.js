import { JobService } from './job.service.js';

export const getAllJobsController = async (req, res, next) => {
  try {
    const jobs = await JobService.getAllJobs(req.query);
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
};

export const createJobController = async (req, res, next) => {
  try {
    const job = await JobService.createJob(req.body);
    res.status(201).json({ success: true, message: 'Job created successfully', data: job });
  } catch (error) {
    next(error);
  }
};

export const getJobStatsController = async (req, res, next) => {
  try {
    const stats = await JobService.getJobStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const updateJobController = async (req, res, next) => {
  try {
    const updated = await JobService.updateJob(req.params.id, req.body);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteJobController = async (req, res, next) => {
  try {
    await JobService.deleteJob(req.params.id);
    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
};
