import JobModel from './job.model.js';
import NotificationModel from '../notification/notification.model.js';
import { NotFoundError } from '../../core/errors/AppError.js';

export class JobService {
  static async getAllJobs({ search, status, industry, rto, location, employmentType }) {
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { employer: { $regex: search, $options: 'i' } },
      ];
    }
    if (status && status !== 'All') query.status = status;
    if (industry && industry !== 'All') query.industry = industry;
    if (rto && rto !== 'All') query.rto = rto;
    if (location && location !== 'All') query.location = location;
    if (employmentType && employmentType !== 'All') query.employmentType = employmentType;

    return await JobModel.find(query).sort({ createdAt: -1 });
  }

  static async createJob(jobData) {
    const job = new JobModel(jobData);
    await job.save();

    // Trigger Notification
    try {
      await NotificationModel.create({
        title: 'New Job Position Posted',
        desc: `${job.title} position posted by ${job.employer}`,
        type: 'job',
        link: '/jobs',
      });
    } catch (err) {
      console.error('Failed to create job notification:', err);
    }

    return job;
  }

  static async getJobStats() {
    const [totalJobs, openJobs, filledJobs, draftJobs, expiredJobs, cancelledJobs, allJobs] = await Promise.all([
      JobModel.countDocuments(),
      JobModel.countDocuments({ status: 'Open' }),
      JobModel.countDocuments({ status: 'Filled' }),
      JobModel.countDocuments({ status: 'Draft' }),
      JobModel.countDocuments({ status: 'Expired' }),
      JobModel.countDocuments({ status: 'Cancelled' }),
      JobModel.find(),
    ]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = await JobModel.countDocuments({ createdAt: { $gte: startOfMonth } });
    const totalApplicants = allJobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0);

    return {
      totalJobs,
      openJobs,
      filledJobs,
      draftJobs,
      expiredJobs,
      cancelledJobs,
      newThisMonth,
      totalApplicants,
    };
  }

  static async updateJob(id, updateData) {
    const updated = await JobModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      throw new NotFoundError('Job not found');
    }
    return updated;
  }

  static async deleteJob(id) {
    const deleted = await JobModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundError('Job not found');
    }
    return true;
  }
}
