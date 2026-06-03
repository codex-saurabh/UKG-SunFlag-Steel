/**
 * server/src/models/index.js
 *
 * Barrel export for all Mongoose models.
 * AuditLog is in its own file (models/AuditLog.js).
 * Attendance models are in models/Attendance.js.
 * Employee model is in models/Employee.js.
 */

const mongoose = require('mongoose');
const { LEAVE_TYPES, SHIFTS, ROLES, SYNC_SOURCE } = require('../config/constants');

// ─── Leave ─────────────────────────────────────────────────────────────────
const leaveSchema = new mongoose.Schema({
  employeeCode:  { type: String, required: true, index: true },
  ukgId:         { type: String, required: true },
  leaveType:     { type: String, default: 'CL' },
  leaveTypeLabel:{ type: String },
  fromDate:      { type: Date, required: true },
  toDate:        { type: Date, required: true },
  days:          { type: Number, required: true },
  status:        { type: String, enum: ['Approved','Pending','Rejected','Cancelled'], default: 'Approved' },
  reason:        { type: String },
  approvedBy:    { type: String },
  ukgLeaveId:    { type: String, unique: true, sparse: true },
  syncSource:    { type: String, enum: Object.values(SYNC_SOURCE), default: 'seed' },
  ukgHash:       { type: String },
}, { timestamps: true, collection: 'leaves_raw' });

leaveSchema.index({ employeeCode: 1, fromDate: 1, toDate: 1 });
leaveSchema.index({ fromDate: 1, toDate: 1, status: 1 });

// ─── Shift Schedule ─────────────────────────────────────────────────────────
const shiftScheduleSchema = new mongoose.Schema({
  employeeCode: { type: String, required: true, index: true },
  ukgId:        { type: String, required: true },
  date:         { type: Date, required: true, index: true },
  dateStr:      { type: String, required: true },
  shiftCode:    { type: String, enum: Object.keys(SHIFTS), required: true },
  syncSource:   { type: String, enum: Object.values(SYNC_SOURCE), default: 'seed' },
  ukgHash:      { type: String },
}, { timestamps: true, collection: 'shift_schedules_raw' });

shiftScheduleSchema.index({ employeeCode: 1, date: 1 }, { unique: true });
shiftScheduleSchema.index({ date: 1, shiftCode: 1 });

// ─── Holiday ─────────────────────────────────────────────────────────────────
const holidaySchema = new mongoose.Schema({
  date:    { type: Date, required: true, unique: true },
  dateStr: { type: String, required: true },
  name:    { type: String, required: true },
  type:    { type: String, enum: ['National','Festival','Optional','Restricted'], default: 'Festival' },
}, { timestamps: true, collection: 'holidays' });

// ─── System User ─────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  password:     { type: String, required: true, select: false },
  role:         { type: String, enum: Object.values(ROLES), required: true },
  isActive:     { type: Boolean, default: true },
  employeeCode: { type: String, default: null },
  lastLoginAt:  { type: Date },
}, { timestamps: true, collection: 'users' });

userSchema.index({ email: 1, isActive: 1 });

// ─── Job Log ──────────────────────────────────────────────────────────────────
const jobLogSchema = new mongoose.Schema({
  jobName:          { type: String, required: true, index: true },
  status:           { type: String, enum: ['running','success','failed','skipped'], required: true },
  startedAt:        { type: Date, required: true },
  endedAt:          { type: Date },
  durationMs:       { type: Number },
  recordsProcessed: { type: Number, default: 0 },
  recordsCreated:   { type: Number, default: 0 },
  recordsUpdated:   { type: Number, default: 0 },
  error:            { type: String },
  meta:             { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true, collection: 'job_logs' });

jobLogSchema.index({ jobName: 1, startedAt: -1 });
jobLogSchema.index({ status: 1, startedAt: -1 });

// ─── Dashboard Cache ──────────────────────────────────────────────────────────
const dashboardCacheSchema = new mongoose.Schema({
  key:       { type: String, required: true, unique: true },
  data:      { type: mongoose.Schema.Types.Mixed },
  builtAt:   { type: Date, default: Date.now },
  expiresAt: { type: Date },
}, { timestamps: true, collection: 'dashboard_cache' });

dashboardCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = {
  AuditLog:       require('./AuditLog'),          // own file
  Leave:          mongoose.model('Leave', leaveSchema),
  ShiftSchedule:  mongoose.model('ShiftSchedule', shiftScheduleSchema),
  Holiday:        mongoose.model('Holiday', holidaySchema),
  User:           mongoose.model('User', userSchema),
  JobLog:         mongoose.model('JobLog', jobLogSchema),
  DashboardCache: mongoose.model('DashboardCache', dashboardCacheSchema),
};
