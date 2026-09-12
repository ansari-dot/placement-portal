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

export const getRTOByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const rto = await RtoModel.findById(id);
    if (!rto) {
      return res.status(404).json({ success: false, message: 'RTO not found' });
    }
    res.status(200).json({
      success: true,
      data: rto
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
      abn,
      acn,
      website,
      yearEstablished,
      shortDescription,
      paymentCycle,
      payoutRate,
      coursePricing,
      logo,
      registrationCertificate,
      registrationCertificateName,
      documents,
      contactName,
      contactEmail,
      contactTitle,
      contactDepartment,
      contactPhone,
      contactWhatsapp,
      contactMobile,
      contactFax,
      addressLine1,
      addressLine2,
      suburb,
      state,
      postcode,
      country,
      partnershipSince,
      registrationNumber,
      issuingAuthority,
    } = req.body;

    if (!rtoName || !rtoName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'RTO Name is required'
      });
    }

    // Auto-generate a clean code if none is provided
    const generatedCode = (rtoCode && rtoCode.trim()) 
      ? rtoCode.trim() 
      : `RTO-${Math.floor(10000 + Math.random() * 90000)}`;

    const rto = new RtoModel({
      name: rtoName.trim(),
      code: generatedCode,
      abn: abn || '',
      acn: acn || '',
      website: website || '',
      yearEstablished: yearEstablished || '',
      shortDescription: shortDescription || '',
      paymentCycle: paymentCycle || 'Placement',
      payoutRate: Number(payoutRate) || 0,
      coursePricing: Array.isArray(coursePricing) ? coursePricing : [],
      logo: logo || '',
      registrationCertificate: registrationCertificate || '',
      registrationCertificateName: registrationCertificateName || '',
      documents: Array.isArray(documents) ? documents : [],
      contactName: contactName || '',
      contactEmail: contactEmail || '',
      contactTitle: contactTitle || '',
      contactDepartment: contactDepartment || '',
      contactPhone: contactPhone || '',
      contactWhatsapp: contactWhatsapp || '',
      contactMobile: contactMobile || '',
      contactFax: contactFax || '',
      address: addressLine1 || '',
      addressLine2: addressLine2 || '',
      suburb: suburb || '',
      state: state || '',
      postcode: postcode || '',
      country: country || 'Australia',
      partnershipSince: partnershipSince || new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      registrationNumber: registrationNumber || '',
      issuingAuthority: issuingAuthority || '',
      loc: suburb && state ? `${suburb}, ${state}` : 'Melbourne, VIC',
      date: partnershipSince || new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Active',
      students: 0
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

export const updateRTOController = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.rtoName) updates.name = updates.rtoName;
    if (updates.rtoCode) updates.code = updates.rtoCode;
    if (updates.addressLine1) updates.address = updates.addressLine1;
    if (updates.suburb && updates.state) updates.loc = `${updates.suburb}, ${updates.state}`;

    const rto = await RtoModel.findByIdAndUpdate(id, updates, { new: true });
    if (!rto) {
      return res.status(404).json({ success: false, message: 'RTO not found' });
    }

    res.status(200).json({
      success: true,
      message: 'RTO updated successfully',
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

