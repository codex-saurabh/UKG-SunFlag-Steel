const mongoose = require('mongoose');
const { DEPARTMENTS, DESIGNATIONS, SHIFTS } = require('../config/constants');

const employeeSchema = new mongoose.Schema({
  // UKG employee identifier — will be the primary join key when API is live
  ukgId: { type: String, required: true, unique: true, index: true },

  employeeCode: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, lowercase: true },
  phone: { type: String },

  department: { type: String, enum: DEPARTMENTS, index: true },
  designation: { type: String },
  category: { type: String, enum: ['Staff', 'Worker', 'Contract', 'Trainee'], default: 'Worker' },

  // Shift assignment — what UKG calls "work rule" or "schedule"
  defaultShift: { type: String, enum: Object.keys(SHIFTS), default: 'G' },

  // Weekly off configuration — UKG stores this per employee
  weeklyOff: {
    day1: { type: Number, min: 0, max: 6, default: 0 }, // 0=Sun
    day2: { type: Number, min: 0, max: 6, default: null },
  },

  joiningDate: { type: Date },
  status: { type: String, enum: ['Active', 'Inactive', 'Resigned', 'Retired'], default: 'Active', index: true },

  // Sync metadata
  syncSource: { type: String, default: 'seed' },
  ukgHash: { type: String }, // hash of raw UKG record — used to detect changes
  lastSyncedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'employees_raw',
});

employeeSchema.index({ department: 1, status: 1 });
employeeSchema.index({ employeeCode: 1, status: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
