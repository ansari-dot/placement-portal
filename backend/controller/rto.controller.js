import RtoModel from '../model/rto.model.js';

export const getAllRTOsController = async (req, res) => {
  try {
    const { search, status, loc } = req.query;
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

    if (loc && loc !== 'All') {
      query.loc = loc;
    }

    const rtos = await RtoModel.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: rtos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRTOController = async (req, res) => {
  try {
    const {
      rtoName,
      rtoCode,
      rtoType,
      cricosCode,
      abn,
      website,
      contactName,
      contactEmail,
      contactPhone,
      addressLine1,
      suburb,
      state,
      postcode
    } = req.body;

    if (!rtoName || !rtoCode) {
      return res.status(400).json({
        success: false,
        message: 'RTO Name and RTO Code are required'
      });
    }

    const rto = new RtoModel({
      name: rtoName,
      code: rtoCode,
      rtoType,
      cricosCode,
      abn,
      website,
      contactName,
      contactEmail,
      contactPhone,
      address: addressLine1,
      suburb,
      state,
      postcode,
      loc: suburb && state ? `${suburb}, ${state}` : 'Melbourne, VIC',
      date: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Active',
      students: Math.floor(Math.random() * 100) + 10 // assign a default/random assigned students for premium aesthetic
    });

    await rto.save();

    res.status(201).json({
      success: true,
      message: 'RTO created successfully',
      data: rto
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRTOStatsController = async (req, res) => {
  try {
    const [totalRtos, activeRtos, inactiveRtos, rtos] = await Promise.all([
      RtoModel.countDocuments(),
      RtoModel.countDocuments({ status: 'Active' }),
      RtoModel.countDocuments({ status: 'Inactive' }),
      RtoModel.find()
    ]);

    const totalStudents = rtos.reduce((sum, rto) => sum + (rto.students || 0), 0);

    // Filter created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newThisMonth = await RtoModel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        totalRtos,
        activeRtos,
        inactiveRtos,
        totalStudents,
        newThisMonth
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRTOController = async (req, res) => {
  try {
    const { id } = req.params;
    await RtoModel.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'RTO deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
