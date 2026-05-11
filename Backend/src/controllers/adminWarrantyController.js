const ExcelJS = require('exceljs');
const Warranty = require('../models/Warranty');
const asyncHandler = require('../utils/asyncHandler');

function buildWarrantyFilter(query) {
  const search = String(query.search || '').trim();
  const startDate = query.startDate ? new Date(query.startDate) : null;
  const endDate = query.endDate ? new Date(query.endDate) : null;
  const month = String(query.month || '').trim(); // format: YYYY-MM

  const filter = {};

  if (search) {
    filter.$or = [
      { qrId: { $regex: search, $options: 'i' } },
      { scooterName: { $regex: search, $options: 'i' } },
      { scooterColor: { $regex: search, $options: 'i' } },
      { controllerNumber: { $regex: search, $options: 'i' } },
      { batteryNumber: { $regex: search, $options: 'i' } },
      { motorNumber: { $regex: search, $options: 'i' } },
      { chassisNumber: { $regex: search, $options: 'i' } },
      { chargerNumber: { $regex: search, $options: 'i' } },
      { dealerName: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
      { contactNumber: { $regex: search, $options: 'i' } },
      { dealerAddress: { $regex: search, $options: 'i' } },
      { state: { $regex: search, $options: 'i' } }
    ];
  }

  if (month) {
    const [year, monthNumber] = month.split('-').map(Number);

    if (year && monthNumber) {
      const monthStart = new Date(year, monthNumber - 1, 1);
      const monthEnd = new Date(year, monthNumber, 1);

      filter.createdAt = {
        $gte: monthStart,
        $lt: monthEnd
      };
    }
  } else if (startDate || endDate) {
    filter.createdAt = {};

    if (startDate) {
      startDate.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = startDate;
    }

    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDate;
    }
  }

  return filter;
}

const getWarrantyRecords = asyncHandler(async (req, res) => {
  const filter = buildWarrantyFilter(req.query);

  const records = await Warranty.find(filter).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: records.length,
    data: records
  });
});

const getWarrantyDetail = asyncHandler(async (req, res) => {
  const qrId = String(req.params.qrId || '').trim().toUpperCase();

  const warranty = await Warranty.findOne({ qrId });

  if (!warranty) {
    return res.status(404).json({
      success: false,
      message: 'Warranty record not found'
    });
  }

  res.json({
    success: true,
    data: warranty
  });
});

const updateWarrantyDetail = asyncHandler(async (req, res) => {
  const qrId = String(req.params.qrId || '').trim().toUpperCase();

  const warranty = await Warranty.findOne({ qrId });

  if (!warranty) {
    return res.status(404).json({
      success: false,
      message: 'Warranty record not found'
    });
  }

  const allowedFields = [
    'scooterName',
    'scooterColor',
    'controllerNumber',
    'batteryNumber',
    'motorNumber',
    'chassisNumber',
    'chargerNumber',
    'dealerName',
    'dealerAddress',
    'state',
    'dateOfSale',
    'customerName',
    'contactNumber'
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      warranty[field] =
        typeof req.body[field] === 'string'
          ? req.body[field].trim()
          : req.body[field];
    }
  });

  if (warranty.controllerNumber) warranty.controllerNumber = warranty.controllerNumber.toUpperCase();
  if (warranty.batteryNumber) warranty.batteryNumber = warranty.batteryNumber.toUpperCase();
  if (warranty.motorNumber) warranty.motorNumber = warranty.motorNumber.toUpperCase();
  if (warranty.chassisNumber) warranty.chassisNumber = warranty.chassisNumber.toUpperCase();
  if (warranty.chargerNumber) warranty.chargerNumber = warranty.chargerNumber.toUpperCase();

  await warranty.save();

  res.json({
    success: true,
    message: 'Warranty record updated successfully',
    data: warranty
  });
});

const exportWarrantyExcel = asyncHandler(async (req, res) => {
  const filter = buildWarrantyFilter(req.query);

  const records = await Warranty.find(filter).sort({ createdAt: -1 }).lean();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Warranty Records');

  worksheet.columns = [
    { header: 'QR ID', key: 'qrId', width: 22 },
    { header: 'Scooter Name', key: 'scooterName', width: 25 },
    { header: 'Scooter Color', key: 'scooterColor', width: 18 },
    { header: 'Controller Number', key: 'controllerNumber', width: 24 },
    { header: 'Battery Number', key: 'batteryNumber', width: 24 },
    { header: 'Motor Number', key: 'motorNumber', width: 24 },
    { header: 'Chassis Number', key: 'chassisNumber', width: 24 },
    { header: 'Charger Number', key: 'chargerNumber', width: 24 },
    { header: 'Dealer Name', key: 'dealerName', width: 28 },
    { header: 'Dealer Address', key: 'dealerAddress', width: 40 },
    { header: 'State', key: 'state', width: 20 },
    { header: 'Date of Sale', key: 'dateOfSale', width: 18 },
    { header: 'Customer Name', key: 'customerName', width: 28 },
    { header: 'Contact Number', key: 'contactNumber', width: 18 },
    { header: 'Registered At', key: 'createdAt', width: 24 }
  ];

  records.forEach((record) => {
    worksheet.addRow({
      qrId: record.qrId,
      scooterName: record.scooterName,
      scooterColor: record.scooterColor,
      controllerNumber: record.controllerNumber,
      batteryNumber: record.batteryNumber,
      motorNumber: record.motorNumber,
      chassisNumber: record.chassisNumber,
      chargerNumber: record.chargerNumber,
      dealerName: record.dealerName,
      dealerAddress: record.dealerAddress,
      state: record.state,
      dateOfSale: record.dateOfSale
        ? new Date(record.dateOfSale).toLocaleDateString('en-IN')
        : '',
      customerName: record.customerName,
      contactNumber: record.contactNumber,
      createdAt: record.createdAt
        ? new Date(record.createdAt).toLocaleString('en-IN')
        : ''
    });
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).height = 22;

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true
      };
    });
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );

  res.setHeader(
    'Content-Disposition',
    'attachment; filename=warranty-records.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = {
  getWarrantyRecords,
  getWarrantyDetail,
  updateWarrantyDetail,
  exportWarrantyExcel
};