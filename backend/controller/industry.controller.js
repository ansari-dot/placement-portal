import IndustryModel from '../model/industry.model.js';

export const getAllIndustriesController = async (req, res) => {
  try {
    const { search, status, sector } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (sector && sector !== 'All') {
      query.sector = sector;
    }

    const industries = await IndustryModel.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: industries
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createIndustryController = async (req, res) => {
  try {
    const {
      industryName,
      industryCode,
      industryType, // maps to sector
      abn,
      website,
      shortDescription,
      suburb,
      state
    } = req.body;

    if (!industryName || !industryCode || !industryType) {
      return res.status(400).json({
        success: false,
        message: 'Company Name, Code, and Sector are required'
      });
    }

    const industry = new IndustryModel({
      name: industryName,
      code: industryCode,
      sector: industryType,
      abn,
      website,
      shortDescription,
      location: suburb && state ? `${suburb}, ${state}` : 'Sydney, NSW',
      status: 'Active',
      students: Math.floor(Math.random() * 20),
      jobs: Math.floor(Math.random() * 10) + 1
    });

    await industry.save();

    res.status(201).json({
      success: true,
      message: 'Industry created successfully',
      data: industry
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getIndustryStatsController = async (req, res) => {
  try {
    const [totalIndustries, activeIndustries, inactiveIndustries, list] = await Promise.all([
      IndustryModel.countDocuments(),
      IndustryModel.countDocuments({ status: 'Active' }),
      IndustryModel.countDocuments({ status: 'Inactive' }),
      IndustryModel.find()
    ]);

    const totalStudents = list.reduce((sum, item) => sum + (item.students || 0), 0);
    const totalJobs = list.reduce((sum, item) => sum + (item.jobs || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalIndustries,
        activeIndustries,
        inactiveIndustries,
        totalStudents,
        totalJobs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteIndustryController = async (req, res) => {
  try {
    const { id } = req.params;
    await IndustryModel.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Industry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
