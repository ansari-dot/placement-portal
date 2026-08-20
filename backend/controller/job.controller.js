import JobModel from '../model/job.model.js';
import NotificationModel from '../model/notification.model.js';

export const getAllJobsController = async (req, res) => {
  try {
    const { search, status, industry, rto, location, employmentType } = req.query;
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

    const jobs = await JobModel.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createJobController = async (req, res) => {
  try {
    const { title, employer, industry, rto, location, employmentType, description, requirements, salary, expiryDate } = req.body;

    if (!title || !employer) {
      return res.status(400).json({ success: false, message: 'Job Title and Employer are required' });
    }

    const job = new JobModel({ title, employer, industry, rto, location, employmentType, description, requirements, salary, expiryDate });
    await job.save();

    // Trigger Notification
    try {
      await NotificationModel.create({
        title: 'New Job Position Posted',
        desc: `${title} position posted by ${employer}`,
        type: 'job',
        link: '/jobs',
      });
    } catch (err) {
      console.error('Failed to create notification:', err);
    }

    res.status(201).json({ success: true, message: 'Job created successfully', data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getJobStatsController = async (req, res) => {
  try {
    const [totalJobs, openJobs, filledJobs, draftJobs, expiredJobs, cancelledJobs, allJobs] = await Promise.all([
      JobModel.countDocuments(),
      JobModel.countDocuments({ status: 'Open' }),
      JobModel.countDocuments({ status: 'Filled' }),
      JobModel.countDocuments({ status: 'Draft' }),
      JobModel.countDocuments({ status: 'Expired' }),
      JobModel.countDocuments({ status: 'Cancelled' }),
      JobModel.find()
    ]);

    // Count jobs posted this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = await JobModel.countDocuments({ createdAt: { $gte: startOfMonth } });

    // Aggregate applicants
    const totalApplicants = allJobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalJobs,
        openJobs,
        filledJobs,
        draftJobs,
        expiredJobs,
        cancelledJobs,
        newThisMonth,
        totalApplicants
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteJobController = async (req, res) => {
  try {
    const { id } = req.params;
    await JobModel.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateJobController = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await JobModel.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
