const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const Admin = require('../models/admin');
const QrCodeModel = require('../models/QrCode');
const Customer = require('../models/Customer');
const ScanLog = require('../models/ScanLog');
const AlertLog = require('../models/AlertLog');
const AuditLog = require('../models/AuditLog');
const EmergencyContact = require('../models/EmergencyContact');

const generateQrId = require('../utils/generateQrId');
const asyncHandler = require('../utils/asyncHandler');

function signToken(admin) {
  return jwt.sign(
    { id: admin._id, email: admin.email, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });

  if (!admin) {
    return res.status(401).json({
      message: 'Invalid email or password'
    });
  }

  const matched = await bcrypt.compare(password, admin.passwordHash);

  if (!matched) {
    return res.status(401).json({
      message: 'Invalid email or password'
    });
  }

  res.json({
    message: 'Login successful',
    token: signToken(admin),
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    }
  });
});

const createQr = asyncHandler(async (req, res) => {
  const qrId = await generateQrId();

  const activationLink = `${process.env.APP_BASE_URL}/qr/${qrId}`;
  const emergencyLink = `${process.env.APP_BASE_URL}/emergency/${qrId}`;

  const qrImageDataUrl = await QRCode.toDataURL(activationLink);

  const qr = await QrCodeModel.create({
    qrId,
    qrImageDataUrl,
    activationLink,
    emergencyLink,
    status: 'inactive',
    warrantyStatus: 'pending',
    emergencyStatus: 'inactive',
    ownerMobile: '',
    createdBy: req.admin._id
  });

  await AuditLog.create({
    adminId: req.admin._id,
    action: 'CREATE_QR',
    qrId,
    details: {
      warrantyStatus: 'pending',
      emergencyStatus: 'inactive'
    }
  });

  res.status(201).json({
    message: 'QR created successfully',
    data: qr
  });
});

const bulkCreateQr = asyncHandler(async (req, res) => {
  let { count = 10 } = req.body;

  count = Number(count);

  if (!Number.isInteger(count) || count < 1 || count > 100) {
    return res.status(400).json({
      message: 'Count must be between 1 and 100'
    });
  }

  const created = [];

  for (let i = 0; i < count; i++) {
    const qrId = await generateQrId();

    const activationLink = `${process.env.APP_BASE_URL}/qr/${qrId}`;
    const emergencyLink = `${process.env.APP_BASE_URL}/emergency/${qrId}`;

    const qrImageDataUrl = await QRCode.toDataURL(activationLink);

    const qr = await QrCodeModel.create({
      qrId,
      qrImageDataUrl,
      activationLink,
      emergencyLink,
      status: 'inactive',
      warrantyStatus: 'pending',
      emergencyStatus: 'inactive',
      ownerMobile: '',
      createdBy: req.admin._id
    });

    created.push({
      _id: qr._id,
      qrId: qr.qrId,
      qrImageDataUrl: qr.qrImageDataUrl,
      activationLink: qr.activationLink,
      emergencyLink: qr.emergencyLink,
      status: qr.status,
      warrantyStatus: qr.warrantyStatus,
      emergencyStatus: qr.emergencyStatus,
      ownerMobile: qr.ownerMobile
    });
  }

  await AuditLog.create({
    adminId: req.admin._id,
    action: 'BULK_CREATE_QR',
    qrId: '',
    details: { count }
  });

  res.status(201).json({
    message: `${count} QRs generated successfully`,
    count,
    data: created
  });
});

const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalQrs,
    activeQrs,
    inactiveQrs,
    blockedQrs,
    warrantyPending,
    warrantyRegistered,
    emergencyInactive,
    emergencyActive,
    emergencySkipped,
    totalCustomers,
    totalScans,
    totalAlerts,
    recentScans
  ] = await Promise.all([
    QrCodeModel.countDocuments(),
    QrCodeModel.countDocuments({ status: 'active' }),
    QrCodeModel.countDocuments({ status: 'inactive' }),
    QrCodeModel.countDocuments({ status: 'blocked' }),

    QrCodeModel.countDocuments({ warrantyStatus: 'pending' }),
    QrCodeModel.countDocuments({ warrantyStatus: 'registered' }),

    QrCodeModel.countDocuments({ emergencyStatus: 'inactive' }),
    QrCodeModel.countDocuments({ emergencyStatus: 'active' }),
    QrCodeModel.countDocuments({ emergencyStatus: 'skipped' }),

    Customer.countDocuments(),
    ScanLog.countDocuments(),
    AlertLog.countDocuments(),
    ScanLog.find().sort({ createdAt: -1 }).limit(10)
  ]);

  res.json({
    totalQrs,
    activeQrs,
    inactiveQrs,
    blockedQrs,
    warrantyPending,
    warrantyRegistered,
    emergencyInactive,
    emergencyActive,
    emergencySkipped,
    totalCustomers,
    totalScans,
    totalAlerts,
    recentScans
  });
});

const listQrs = asyncHandler(async (req, res) => {
  const { status, warrantyStatus, emergencyStatus, search } = req.query;

  const pipeline = [
    {
      $lookup: {
        from: 'customers',
        localField: 'qrId',
        foreignField: 'qrId',
        as: 'customer'
      }
    },
    {
      $unwind: {
        path: '$customer',
        preserveNullAndEmptyArrays: true
      }
    }
  ];

  const match = {};

  if (status) {
    match.status = status;
  }

  if (warrantyStatus) {
    match.warrantyStatus = warrantyStatus;
  }

  if (emergencyStatus) {
    match.emergencyStatus = emergencyStatus;
  }

  if (search) {
    match.$or = [
      { qrId: { $regex: search, $options: 'i' } },
      { status: { $regex: search, $options: 'i' } },
      { warrantyStatus: { $regex: search, $options: 'i' } },
      { emergencyStatus: { $regex: search, $options: 'i' } },
      { ownerMobile: { $regex: search, $options: 'i' } },

      { 'customer.customerName': { $regex: search, $options: 'i' } },
      { 'customer.mobileNumber': { $regex: search, $options: 'i' } },
      { 'customer.vehicleName': { $regex: search, $options: 'i' } },
      { 'customer.showroomName': { $regex: search, $options: 'i' } },
      { 'customer.chassisNumber': { $regex: search, $options: 'i' } },
      { 'customer.motorNumber': { $regex: search, $options: 'i' } }
    ];
  }

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  pipeline.push(
    {
      $project: {
        _id: 1,
        qrId: 1,
        qrImageDataUrl: 1,
        activationLink: 1,
        emergencyLink: 1,

        status: 1,
        previousStatus: 1,
        blockedReason: 1,

        warrantyStatus: 1,
        emergencyStatus: 1,
        ownerMobile: 1,

        createdAt: 1,
        updatedAt: 1,

        customerName: '$customer.customerName',
        mobileNumber: '$customer.mobileNumber',
        email: '$customer.email',
        bloodGroup: '$customer.bloodGroup',
        disease: '$customer.disease',
        address: '$customer.address',
        vehicleName: '$customer.vehicleName',
        chassisNumber: '$customer.chassisNumber',
        motorNumber: '$customer.motorNumber',
        showroomName: '$customer.showroomName'
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  );

  const data = await QrCodeModel.aggregate(pipeline);
  res.json(data);
});

const getQrById = asyncHandler(async (req, res) => {
  const qr = await QrCodeModel.findById(req.params.id);

  if (!qr) {
    return res.status(404).json({
      message: 'QR not found'
    });
  }

  const customer = await Customer.findOne({ qrId: qr.qrId });
  const contacts = await EmergencyContact.findOne({ qrId: qr.qrId });

  res.json({
    qr,
    customer,
    contacts
  });
});

const updateQr = asyncHandler(async (req, res) => {
  const qr = await QrCodeModel.findById(req.params.id);

  if (!qr) {
    return res.status(404).json({
      message: 'QR not found'
    });
  }

  const allowedFields = [
    'status',
    'previousStatus',
    'blockedReason',
    'warrantyStatus',
    'emergencyStatus',
    'ownerMobile'
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      qr[field] = req.body[field] || '';
    }
  });

  await qr.save();

  await AuditLog.create({
    adminId: req.admin._id,
    action: 'UPDATE_QR',
    qrId: qr.qrId,
    details: req.body
  });

  res.json({
    message: 'QR updated successfully',
    data: qr
  });
});

const updateQrDetails = asyncHandler(async (req, res) => {
  const qr = await QrCodeModel.findById(req.params.id);

  if (!qr) {
    return res.status(404).json({
      message: 'QR not found'
    });
  }

  const {
    customerName,
    mobileNumber,
    email = '',
    bloodGroup = '',
    disease = '',
    address = '',
    vehicleName = '',
    chassisNumber = '',
    motorNumber = '',
    showroomName = '',
    contacts = []
  } = req.body;

  if (!customerName || !mobileNumber) {
    return res.status(400).json({
      message: 'Customer name and mobile number are required'
    });
  }

  if (!/^[0-9]{10}$/.test(String(mobileNumber))) {
    return res.status(400).json({
      message: 'Mobile number must be 10 digits'
    });
  }

  if (!Array.isArray(contacts) || contacts.length !== 3) {
    return res.status(400).json({
      message: 'Exactly 3 emergency contacts are required'
    });
  }

  for (const contact of contacts) {
    if (!contact.name || !contact.mobile || !contact.relation) {
      return res.status(400).json({
        message: 'Each emergency contact must have name, mobile and relation'
      });
    }

    if (!/^[0-9]{10}$/.test(String(contact.mobile))) {
      return res.status(400).json({
        message: 'Each emergency contact mobile must be 10 digits'
      });
    }
  }

  const customerPayload = {
    qrId: qr.qrId,
    customerName: String(customerName).trim(),
    mobileNumber: String(mobileNumber).trim(),
    email: String(email || '').trim(),
    bloodGroup: String(bloodGroup || '').trim(),
    disease: String(disease || '').trim(),
    address: String(address || '').trim(),
    vehicleName: String(vehicleName || '').trim(),
    chassisNumber: String(chassisNumber || '').trim().toUpperCase(),
    motorNumber: String(motorNumber || '').trim().toUpperCase(),
    showroomName: String(showroomName || '').trim(),
    otpVerified: true,
    isActive: true
  };

  let customer = await Customer.findOne({ qrId: qr.qrId });

  if (!customer) {
    customer = await Customer.create(customerPayload);
  } else {
    Object.assign(customer, customerPayload);
    await customer.save();
  }

  const cleanedContacts = contacts.map((contact) => ({
    name: String(contact.name || '').trim(),
    mobile: String(contact.mobile || '').trim(),
    email: String(contact.email || '').trim(),
    relation: String(contact.relation || '').trim()
  }));

  await EmergencyContact.findOneAndUpdate(
    { qrId: qr.qrId },
    {
      qrId: qr.qrId,
      contacts: cleanedContacts
    },
    {
      upsert: true,
      new: true
    }
  );

  qr.ownerMobile = String(mobileNumber).trim();

  if (qr.status !== 'blocked') {
    qr.status = 'active';
  }

  qr.emergencyStatus = 'active';

  if (!qr.emergencyActivatedAt) {
    qr.emergencyActivatedAt = new Date();
  }

  await qr.save();

  await AuditLog.create({
    adminId: req.admin._id,
    action: 'UPDATE_QR_DETAILS',
    qrId: qr.qrId,
    details: {
      customerName: customerPayload.customerName,
      mobileNumber: customerPayload.mobileNumber,
      vehicleName: customerPayload.vehicleName,
      chassisNumber: customerPayload.chassisNumber,
      motorNumber: customerPayload.motorNumber,
      showroomName: customerPayload.showroomName,
      contactsCount: cleanedContacts.length
    }
  });

  res.json({
    success: true,
    message: 'QR details updated successfully',
    data: {
      qr,
      customer,
      contacts: cleanedContacts
    }
  });
});

const blockQr = asyncHandler(async (req, res) => {
  const { reason = '' } = req.body;

  const qr = await QrCodeModel.findById(req.params.id);

  if (!qr) {
    return res.status(404).json({
      message: 'QR not found'
    });
  }

  if (qr.status !== 'blocked') {
    qr.previousStatus = qr.status;
  }

  qr.status = 'blocked';
  qr.blockedReason = reason;
  await qr.save();

  await AuditLog.create({
    adminId: req.admin._id,
    action: 'BLOCK_QR',
    qrId: qr.qrId,
    details: {
      reason,
      previousStatus: qr.previousStatus
    }
  });

  res.json({
    message: 'QR blocked successfully',
    data: qr
  });
});

const unblockQr = asyncHandler(async (req, res) => {
  const qr = await QrCodeModel.findById(req.params.id);

  if (!qr) {
    return res.status(404).json({
      message: 'QR not found'
    });
  }

  if (qr.status !== 'blocked') {
    return res.status(400).json({
      message: 'QR is not blocked'
    });
  }

  qr.status = qr.previousStatus || 'inactive';
  qr.previousStatus = '';
  qr.blockedReason = '';
  await qr.save();

  await AuditLog.create({
    adminId: req.admin._id,
    action: 'UNBLOCK_QR',
    qrId: qr.qrId,
    details: {
      restoredStatus: qr.status
    }
  });

  res.json({
    message: 'QR unblocked successfully',
    data: qr
  });
});

const resetQr = asyncHandler(async (req, res) => {
  const qr = await QrCodeModel.findById(req.params.id);

  if (!qr) {
    return res.status(404).json({
      message: 'QR not found'
    });
  }

  await Customer.deleteOne({ qrId: qr.qrId });
  await EmergencyContact.deleteOne({ qrId: qr.qrId });

  qr.status = qr.warrantyStatus === 'registered' ? 'active' : 'inactive';
  qr.emergencyStatus = 'inactive';
  qr.blockedReason = '';
  qr.previousStatus = '';
  qr.ownerMobile = '';
  await qr.save();

  await AuditLog.create({
    adminId: req.admin._id,
    action: 'RESET_QR_EMERGENCY',
    qrId: qr.qrId,
    details: {
      warrantyStatus: qr.warrantyStatus,
      emergencyStatus: qr.emergencyStatus,
      status: qr.status
    }
  });

  res.json({
    message: 'Emergency profile reset successfully. Warranty record was not deleted.',
    data: qr
  });
});

const getCustomers = asyncHandler(async (req, res) => {
  const data = await Customer.find().sort({ createdAt: -1 });
  res.json(data);
});

const getScanLogs = asyncHandler(async (req, res) => {
  const data = await ScanLog.find().sort({ createdAt: -1 });
  res.json(data);
});

const getAnalytics = asyncHandler(async (req, res) => {
  const statusCounts = await QrCodeModel.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const warrantyCounts = await QrCodeModel.aggregate([
    {
      $group: {
        _id: '$warrantyStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const emergencyCounts = await QrCodeModel.aggregate([
    {
      $group: {
        _id: '$emergencyStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const showroomCounts = await Customer.aggregate([
    {
      $match: {
        showroomName: { $exists: true, $ne: '' }
      }
    },
    {
      $group: {
        _id: '$showroomName',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const scanCounts = await ScanLog.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        '_id.year': -1,
        '_id.month': -1,
        '_id.day': -1
      }
    }
  ]);

  res.json({
    statusCounts,
    warrantyCounts,
    emergencyCounts,
    showroomCounts,
    scanCounts
  });
});

module.exports = {
  loginAdmin,
  createQr,
  bulkCreateQr,
  getDashboard,
  listQrs,
  getQrById,
  updateQr,
  updateQrDetails,
  blockQr,
  unblockQr,
  resetQr,
  getCustomers,
  getScanLogs,
  getAnalytics
};