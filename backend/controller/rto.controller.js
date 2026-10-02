import RtoModel from '../model/rto.model.js';
import UserModel from '../model/user.model.js';

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
      onboardedByName,
      onboardedBy,
    } = req.body;

    if (!rtoName || !rtoName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'RTO Name is required'
      });
    }

    if (!onboardedByName || !String(onboardedByName).trim()) {
      return res.status(400).json({ success: false, message: 'Onboarded By is required' });
    }

    let linkedUser = null;
    if (onboardedBy) {
      linkedUser = await UserModel.findById(onboardedBy).select('_id name');
      if (!linkedUser) {
        return res.status(400).json({ success: false, message: 'Selected Portal User ID was not found' });
      }
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
      students: 0,
      createdBy: req.user?._id || null,
      onboardedByName: String(onboardedByName).trim(),
      onboardedBy: linkedUser?._id || null,
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
    const updates = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(updates, 'onboardedByName')) {
      if (!String(updates.onboardedByName || '').trim()) delete updates.onboardedByName;
      else updates.onboardedByName = String(updates.onboardedByName).trim();
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'onboardedBy') && updates.onboardedBy) {
      const linkedUser = await UserModel.findById(updates.onboardedBy).select('_id name');
      if (!linkedUser) return res.status(400).json({ success: false, message: 'Selected Portal User ID was not found' });
      updates.onboardedBy = linkedUser._id;
    } else if (Object.prototype.hasOwnProperty.call(updates, 'onboardedBy')) {
      updates.onboardedBy = null;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'rtoName')) {
      if (!String(updates.rtoName || '').trim()) {
        return res.status(400).json({ success: false, message: 'RTO Name is required' });
      }
      updates.name = String(updates.rtoName).trim();
      delete updates.rtoName;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'rtoCode')) {
      updates.code = String(updates.rtoCode || '').trim();
      delete updates.rtoCode;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'addressLine1')) {
      updates.address = updates.addressLine1 || '';
      delete updates.addressLine1;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'suburb') || Object.prototype.hasOwnProperty.call(updates, 'state')) {
      const suburb = updates.suburb ?? '';
      const state = updates.state ?? '';
      updates.loc = [suburb, state].filter(Boolean).join(', ');
    }

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
    const deletedRto = await RtoModel.findByIdAndDelete(id);
    if (!deletedRto) {
      return res.status(404).json({ success: false, message: 'RTO not found' });
    }
    res.status(200).json({
      success: true,
      message: 'RTO deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /rtos/my
// Admin → all RTOs.
// Coordinator → only RTOs onboarded (createdBy) by this user (ObjectId match).
export const getMyRTOsController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json({ success: true, data: [] });
    }

    const isAdmin = req.user.role === 'Administrator';
    const rtos = isAdmin
      ? await RtoModel.find().sort({ createdAt: -1 }).lean()
      : await RtoModel.find({ $or: [{ onboardedBy: req.user._id }, { createdBy: req.user._id, onboardedBy: null }] }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({ success: true, data: rtos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

