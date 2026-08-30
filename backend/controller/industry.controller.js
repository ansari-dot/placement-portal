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
      industryType,       // maps to sector
      contactPersonName,
      contactEmail,
      contactPhone,
      contactJobTitle,
      address,
      suburb,
      state,
      postCode,
      country,
      abn,
      website,
      shortDescription,
    } = req.body;

    // Validate all required fields
    const missing = [];
    if (!industryName) missing.push('Industry Name');
    if (!industryType) missing.push('Industry Type');
    if (!contactPersonName) missing.push('Contact Person Name');
    if (!contactEmail) missing.push('Email Address');
    if (!contactPhone) missing.push('Phone Number');
    if (!address) missing.push('Address');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `The following fields are required: ${missing.join(', ')}`,
        missingFields: missing,
      });
    }

    // Auto-generate a unique industry code if not provided
    const finalCode = industryCode || industryName.replace(/\s+/g, '').substring(0, 6).toUpperCase() + Date.now().toString().slice(-4);

    const location = [suburb, state].filter(Boolean).join(', ') || 'Australia';

    const industry = new IndustryModel({
      name: industryName,
      code: finalCode,
      sector: industryType,
      contactPersonName,
      contactEmail,
      contactPhone,
      contactJobTitle,
      address,
      suburb,
      state,
      postCode,
      country: country || 'Australia',
      abn,
      website,
      shortDescription,
      location,
      status: 'Active',
      students: 0,
      jobs: 0,
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

export const updateIndustryController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remap frontend field names to model field names if needed
    if (updateData.industryName) { updateData.name = updateData.industryName; delete updateData.industryName; }
    if (updateData.industryType) { updateData.sector = updateData.industryType; delete updateData.industryType; }
    if (updateData.industryCode) { updateData.code = updateData.industryCode; delete updateData.industryCode; }

    // Rebuild location string if address parts changed
    if (updateData.suburb || updateData.state) {
      const industryDoc = await IndustryModel.findById(id);
      if (industryDoc) {
        const suburb = updateData.suburb ?? industryDoc.suburb;
        const state = updateData.state ?? industryDoc.state;
        updateData.location = [suburb, state].filter(Boolean).join(', ');
      }
    }

    const industry = await IndustryModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!industry) {
      return res.status(404).json({ success: false, message: 'Industry not found' });
    }

    res.status(200).json({ success: true, message: 'Industry updated successfully', data: industry });
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
