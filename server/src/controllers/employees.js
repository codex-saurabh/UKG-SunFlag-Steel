/**
 * server/src/controllers/employees.js
 */

const Employee = require('../models/Employee');
const { asyncHandler } = require('../middleware');
const { ok, paginate, paginateMeta } = require('../utils');
const { DEPARTMENTS } = require('../config/constants');

const getEmployees = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { department, status = 'Active', search } = req.query;

  const match = { status };
  if (department) match.department = department;
  if (search) {
    match.$or = [
      { name:         { $regex: search, $options: 'i' } },
      { employeeCode: { $regex: search, $options: 'i' } },
    ];
  }

  const [employees, total] = await Promise.all([
    Employee.find(match).sort({ employeeCode: 1 }).skip(skip).limit(limit).lean(),
    Employee.countDocuments(match),
  ]);

  ok(res, employees, paginateMeta(total, page, limit));
});

const getEmployee = asyncHandler(async (req, res) => {
  const emp = await Employee.findOne({ employeeCode: req.params.code }).lean();
  if (!emp) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
  ok(res, emp);
});

const getDepartments = asyncHandler(async (req, res) => {
  // Return departments that actually have employees
  const depts = await Employee.distinct('department', { status: 'Active' });
  ok(res, depts.sort());
});

module.exports = { getEmployees, getEmployee, getDepartments };
