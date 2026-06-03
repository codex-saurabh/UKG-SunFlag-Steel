const mongoose = require('mongoose');
const { ATTENDANCE_STATUS, SHIFTS, SYNC_SOURCE } = require('../config/constants');

// Raw punch record — one document per punch event
// UKG may send multiple punches per day; we store all and deduplicate
const punchRawSchema = new mongoose.Schema({
  ukgId:        { type: String, required: true, index: true },
  employeeCode: { type: String, required: true, index: true },
  punchTime:    { type: Date, required: true },
  punchType:    { type: String, enum: ['IN', 'OUT', 'UNKNOWN'], default: 'UNKNOWN' },
  deviceId:     { type: String }, // face recognition machine ID
  isManual:     { type: Boolean, default: false },
  syncSource:   { type: String, enum: Object.values(SYNC_SOURCE), default: 'seed' },
  ukgHash:      { type: String },
}, {
  timestamps: true,
  collection: 'punches_raw',
});

// Prevent exact duplicate punches — same employee, same time, same type
punchRawSchema.index({ employeeCode: 1, punchTime: 1, punchType: 1 }, { unique: true });
punchRawSchema.index({ employeeCode: 1, punchTime: 1 });

// Processed daily attendance record — one document per employee per date
// Built by the attendance service from raw punches + shift schedule
const attendanceDailySchema = new mongoose.Schema({
  employeeCode: { type: String, required: true, index: true },
  ukgId:        { type: String, required: true },
  date:         { type: Date, required: true, index: true },  // normalized to midnight local
  dateStr:      { type: String, required: true },             // "YYYY-MM-DD" for fast string queries

  shift: { type: String, enum: [...Object.keys(SHIFTS), null], default: null },

  status: {
    type: String,
    enum: Object.values(ATTENDANCE_STATUS),
    default: ATTENDANCE_STATUS.ABSENT,
    index: true,
  },

  // Punch data
  inTime:    { type: Date, default: null },
  outTime:   { type: Date, default: null },
  inPunchId: { type: mongoose.Schema.Types.ObjectId, ref: 'PunchRaw' },
  outPunchId:{ type: mongoose.Schema.Types.ObjectId, ref: 'PunchRaw' },

  // Computed durations — stored in minutes
  workMinutes:     { type: Number, default: 0 },
  otMinutes:       { type: Number, default: 0 },
  lateMinutes:     { type: Number, default: 0 },    // minutes late from shift start
  earlyGoMinutes:  { type: Number, default: 0 },    // minutes early from shift end

  // Leave if applicable
  leaveType: { type: String, default: null },
  leaveId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Leave' },

  isWeeklyOff: { type: Boolean, default: false },
  isHoliday:   { type: Boolean, default: false },
  isMissPunch: { type: Boolean, default: false },   // has IN but no OUT or vice versa

  // Reconciliation flag — if manually corrected in UKG after initial sync
  isManuallyAdjusted: { type: Boolean, default: false },

  syncSource:   { type: String, enum: Object.values(SYNC_SOURCE), default: 'seed' },
  computedAt:   { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'attendance_daily',
});

attendanceDailySchema.index({ employeeCode: 1, date: 1 }, { unique: true });
attendanceDailySchema.index({ dateStr: 1, status: 1 });
attendanceDailySchema.index({ date: 1, shift: 1 });

// Monthly summary — pre-aggregated for fast dashboard queries
const attendanceMonthlySchema = new mongoose.Schema({
  employeeCode: { type: String, required: true, index: true },
  ukgId:        { type: String, required: true },
  month:        { type: Number, required: true },  // 1–12
  year:         { type: Number, required: true },

  // Day counts
  presentDays:   { type: Number, default: 0 },
  absentDays:    { type: Number, default: 0 },
  halfDays:      { type: Number, default: 0 },
  leaveDays:     { type: Number, default: 0 },
  weeklyOffDays: { type: Number, default: 0 },
  holidayDays:   { type: Number, default: 0 },
  missPunchDays: { type: Number, default: 0 },
  odDays:        { type: Number, default: 0 },

  // Duration totals — in minutes
  totalWorkMinutes: { type: Number, default: 0 },
  totalOtMinutes:   { type: Number, default: 0 },
  totalLateMinutes: { type: Number, default: 0 },

  // Leave breakdown — dynamic map
  leaveBreakdown: { type: Map, of: Number, default: {} },

  builtAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'attendance_monthly',
});

attendanceMonthlySchema.index({ employeeCode: 1, year: 1, month: 1 }, { unique: true });
attendanceMonthlySchema.index({ year: 1, month: 1 });

const PunchRaw = mongoose.model('PunchRaw', punchRawSchema);
const AttendanceDaily = mongoose.model('AttendanceDaily', attendanceDailySchema);
const AttendanceMonthly = mongoose.model('AttendanceMonthly', attendanceMonthlySchema);

module.exports = { PunchRaw, AttendanceDaily, AttendanceMonthly };
