/**
 * server/src/routes/employees.js
 */

const router = require('express').Router();
const controller = require('../controllers/employees');
const { authenticate, authorize } = require('../middleware');
const { ROLES } = require('../config/constants');

const ALL_ROLES = [ROLES.IT_ADMIN, ROLES.HR_ADMIN, ROLES.TIME_OFFICE];

router.use(authenticate);

// GET /api/v1/employees
router.get('/', authorize(...ALL_ROLES), controller.getEmployees);

// GET /api/v1/employees/departments
router.get('/departments', authorize(...ALL_ROLES), controller.getDepartments);

// GET /api/v1/employees/:code
router.get('/:code', authorize(...ALL_ROLES), controller.getEmployee);

module.exports = router;
