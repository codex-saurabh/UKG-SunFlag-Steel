/**
 * server/src/models/AuditLog.js
 *
 * Audit log — records every significant user action.
 * Written by monitoringService.writeAudit() and never deleted
 * (only archived/exported by the cleanup job after retention period).
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    // Who did it
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    userName:  { type: String },
    role:      { type: String },

    // What they did
    action:    { type: String, required: true, index: true },
    // action format: "resource.operation"  e.g. "export.monthly_attendance", "user.create"

    // What it affected
    entity:    { type: String },   // model name e.g. "AttendanceDaily"
    entityId:  { type: String },   // document ID or identifier

    // Extra context
    meta:      { type: mongoose.Schema.Types.Mixed },  // filters used, filename, etc.

    // Request info
    ip:        { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
    collection: 'audit_logs',
  }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
