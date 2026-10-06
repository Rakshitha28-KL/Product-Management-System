const AuditLog = require('../models/AuditLog');

/**
 * @desc    Get paginated audit logs with search and filters
 * @route   GET /api/audit-logs
 * @access  Private (Admin Only)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const {
      search = '',
      action = '',
      entityType = '',
      user = '',
      startDate = '',
      endDate = '',
      page = 1,
      limit = 15,
    } = req.query;

    const filter = {};

    // Search keyword in description, userName, or action
    if (search && search.trim() !== '') {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { description: { $regex: sanitized, $options: 'i' } },
        { userName: { $regex: sanitized, $options: 'i' } },
        { action: { $regex: sanitized, $options: 'i' } },
        { entityId: { $regex: sanitized, $options: 'i' } },
      ];
    }

    // Filter by specific action
    if (action && action.trim() !== '' && action.toLowerCase() !== 'all') {
      filter.action = action.trim();
    }

    // Filter by entity type
    if (entityType && entityType.trim() !== '' && entityType.toLowerCase() !== 'all') {
      filter.entityType = entityType.trim();
    }

    // Filter by user name
    if (user && user.trim() !== '' && user.toLowerCase() !== 'all') {
      filter.userName = { $regex: user.trim(), $options: 'i' };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 15);
    const skip = (pageNum - 1) * limitNum;

    const [totalLogs, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(totalLogs / limitNum) || 1;

    res.status(200).json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: {
        logs,
        pagination: {
          totalLogs,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single audit log details by ID
 * @route   GET /api/audit-logs/:id
 * @access  Private (Admin Only)
 */
const getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await AuditLog.findById(id).lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: `Audit log record with ID '${id}' not found`,
        errors: [{ message: 'Log record does not exist' }],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Audit log record retrieved',
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get audit log statistics and activity breakdown
 * @route   GET /api/audit-logs/stats
 * @access  Private (Admin Only)
 */
const getAuditLogStats = async (req, res, next) => {
  try {
    const totalLogs = await AuditLog.countDocuments();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayLogsCount = await AuditLog.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    // Breakdown by action
    const actionBreakdown = await AuditLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          action: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Breakdown by entity type
    const entityBreakdown = await AuditLog.aggregate([
      {
        $group: {
          _id: '$entityType',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          entityType: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Unique active users
    const uniqueActors = await AuditLog.distinct('userName');

    res.status(200).json({
      success: true,
      message: 'Audit log statistics retrieved',
      data: {
        totalLogs,
        todayLogsCount,
        actionBreakdown,
        entityBreakdown,
        uniqueActorsCount: uniqueActors.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getAuditLogStats,
};
