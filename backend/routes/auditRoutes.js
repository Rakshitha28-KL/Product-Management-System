const express = require('express');
const router = express.Router();
const {
  getAuditLogs,
  getAuditLogById,
  getAuditLogStats,
} = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// All audit log routes strictly require Admin permissions
router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/stats', getAuditLogStats);
router.get('/', getAuditLogs);
router.get('/:id', getAuditLogById);

module.exports = router;
