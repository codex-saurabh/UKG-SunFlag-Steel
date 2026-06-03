/**
 * Seed script — populates MongoDB with realistic HR data for development.
 * Replaces UKG API until credentials are available.
 *
 * Run:  node src/scripts/seed.js
 * Reset: node src/scripts/seed.js --reset
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const env = require('../config/env');
const { connect } = require('../database/connection');
const {
  DEPARTMENTS, DESIGNATIONS, SHIFTS,
  ATTENDANCE_STATUS, LEAVE_TYPES, ROLES, SYNC_SOURCE
} = require('../config/constants');

const Employee = require('../models/Employee');
const { PunchRaw, AttendanceDaily, AttendanceMonthly } = require('../models/Attendance');
const { Leave, ShiftSchedule, Holiday, User, AuditLog, JobLog } = require('../models/index');

const RESET = process.argv.includes('--reset');
const SEED_DAYS = 90;  // 3 months of history
const EMPLOYEE_COUNT = 25;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hash(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function normalizeToMidnight(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Generate dates going back SEED_DAYS from today
function getDateRange() {
  const dates = [];
  const today = normalizeToMidnight(new Date());
  for (let i = SEED_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d);
  }
  return dates;
}

// ─── Employee definitions ─────────────────────────────────────────────────────

const EMPLOYEE_POOL = [
  { name: 'Rajesh Kumar Singh',     dept: 'Blast Furnace',      desig: 'Shift Supervisor',  shift: 'A', category: 'Worker' },
  { name: 'Sunil Prasad Yadav',     dept: 'Blast Furnace',      desig: 'Plant Operator',    shift: 'B', category: 'Worker' },
  { name: 'Mohammad Irfan Sheikh',  dept: 'Blast Furnace',      desig: 'Helper',            shift: 'C', category: 'Worker' },
  { name: 'Vikram Nair',            dept: 'Steel Melting Shop', desig: 'Senior Operator',   shift: 'A', category: 'Worker' },
  { name: 'Anil Kumar Verma',       dept: 'Steel Melting Shop', desig: 'Plant Operator',    shift: 'B', category: 'Worker' },
  { name: 'Deepak Sharma',          dept: 'Steel Melting Shop', desig: 'Technician',        shift: 'C', category: 'Worker' },
  { name: 'Priya Deshpande',        dept: 'Quality Control',    desig: 'Engineer',          shift: 'G', category: 'Staff' },
  { name: 'Santosh Pillai',         dept: 'Rolling Mill',       desig: 'Shift Supervisor',  shift: 'A', category: 'Worker' },
  { name: 'Ramesh Tiwari',          dept: 'Rolling Mill',       desig: 'Plant Operator',    shift: 'B', category: 'Worker' },
  { name: 'Harish Gupta',           dept: 'Rolling Mill',       desig: 'Helper',            shift: 'C', category: 'Worker' },
  { name: 'Ajay Mishra',            dept: 'Power Plant',        desig: 'Senior Engineer',   shift: 'G', category: 'Staff' },
  { name: 'Sanjay Dubey',           dept: 'Power Plant',        desig: 'Technician',        shift: 'A', category: 'Worker' },
  { name: 'Kavita Joshi',           dept: 'HR & Admin',         desig: 'Assistant Manager', shift: 'G', category: 'Staff' },
  { name: 'Manish Agarwal',         dept: 'Finance',            desig: 'Clerk',             shift: 'G', category: 'Staff' },
  { name: 'Rahul Pathak',           dept: 'Maintenance',        desig: 'Senior Engineer',   shift: 'G', category: 'Staff' },
  { name: 'Ashok Kumar Pal',        dept: 'Maintenance',        desig: 'Technician',        shift: 'B', category: 'Worker' },
  { name: 'Poonam Chaudhary',       dept: 'HR & Admin',         desig: 'Clerk',             shift: 'G', category: 'Staff' },
  { name: 'Suresh Babu',            dept: 'Safety',             desig: 'Deputy Manager',    shift: 'G', category: 'Staff' },
  { name: 'Dinesh Pandey',          dept: 'Blast Furnace',      desig: 'Helper',            shift: 'A', category: 'Worker' },
  { name: 'Ravi Shankar Maurya',    dept: 'Steel Melting Shop', desig: 'Plant Operator',    shift: 'C', category: 'Worker' },
  { name: 'Geeta Singh',            dept: 'Quality Control',    desig: 'Senior Engineer',   shift: 'G', category: 'Staff' },
  { name: 'Manoj Kumar Chauhan',    dept: 'Rolling Mill',       desig: 'Plant Operator',    shift: 'A', category: 'Worker' },
  { name: 'Naresh Yadav',           dept: 'Power Plant',        desig: 'Helper',            shift: 'B', category: 'Worker' },
  { name: 'Rani Devi',              dept: 'IT',                 desig: 'Engineer',          shift: 'G', category: 'Staff' },
  { name: 'Vijay Kumar Tewari',     dept: 'Maintenance',        desig: 'Plant Operator',    shift: 'C', category: 'Worker' },
];

// ─── Holiday list ─────────────────────────────────────────────────────────────

function buildHolidayList(dates) {
  const holidays = [];
  // Seed some fixed holidays within the date range
  const thisYear = new Date().getFullYear();
  const candidates = [
    { name: 'Republic Day',      month: 1,  day: 26, type: 'National' },
    { name: 'Holi',              month: 3,  day: 25, type: 'Festival' },
    { name: 'Ram Navami',        month: 4,  day: 6,  type: 'Festival' },
    { name: 'Independence Day',  month: 8,  day: 15, type: 'National' },
    { name: 'Ganesh Chaturthi',  month: 8,  day: 27, type: 'Festival' },
    { name: 'Gandhi Jayanti',    month: 10, day: 2,  type: 'National' },
    { name: 'Dussehra',          month: 10, day: 12, type: 'Festival' },
    { name: 'Diwali',            month: 10, day: 31, type: 'Festival' },
    { name: 'Christmas',         month: 12, day: 25, type: 'Festival' },
  ];
  const dateStrSet = new Set(dates.map(toDateStr));
  for (const c of candidates) {
    const d = new Date(thisYear, c.month - 1, c.day);
    const ds = toDateStr(d);
    if (dateStrSet.has(ds)) {
      holidays.push({ date: d, dateStr: ds, name: c.name, type: c.type });
    }
  }
  return holidays;
}

// ─── Attendance computation ───────────────────────────────────────────────────

function getShiftTimes(shiftCode, date) {
  const shift = SHIFTS[shiftCode];
  if (!shift) return null;

  const base = normalizeToMidnight(date);

  const inTime = addMinutes(base, shift.startHour * 60);
  let outTime;
  if (shift.crossDate) {
    // Shift C: starts today night, ends next day morning
    const nextDay = new Date(base);
    nextDay.setDate(base.getDate() + 1);
    outTime = addMinutes(nextDay, shift.endHour * 60);
  } else {
    outTime = addMinutes(base, shift.endHour * 60);
  }

  return { inTime, outTime, durationMinutes: (outTime - inTime) / 60000 };
}

function computeStatus(emp, date, holidays, leaves, shiftCode) {
  const dayOfWeek = date.getDay();
  const dateStr = toDateStr(date);

  // Weekly off — worker shift employees typically get Sunday off
  const isWeeklyOff = (dayOfWeek === emp.weeklyOff.day1) ||
    (emp.weeklyOff.day2 !== null && dayOfWeek === emp.weeklyOff.day2);

  if (isWeeklyOff) return { status: ATTENDANCE_STATUS.WEEKLY_OFF, isWeeklyOff: true };

  // Holiday check
  const isHoliday = holidays.has(dateStr);
  if (isHoliday) return { status: ATTENDANCE_STATUS.HOLIDAY, isHoliday: true };

  // Leave check
  const leave = leaves.find(l =>
    l.status === 'Approved' &&
    toDateStr(l.fromDate) <= dateStr && dateStr <= toDateStr(l.toDate)
  );
  if (leave) return { status: ATTENDANCE_STATUS.LEAVE, leaveType: leave.leaveType, leaveId: leave._id };

  // Probability model:
  // 88% present, 3% absent, 3% miss punch, 3% half day, 3% OD
  const r = Math.random();
  if (r < 0.88) return { status: ATTENDANCE_STATUS.PRESENT };
  if (r < 0.91) return { status: ATTENDANCE_STATUS.ABSENT };
  if (r < 0.94) return { status: ATTENDANCE_STATUS.MISS_PUNCH };
  if (r < 0.97) return { status: ATTENDANCE_STATUS.HALF_DAY };
  return { status: ATTENDANCE_STATUS.OD };
}

function buildPunches(emp, date, shiftCode, status) {
  if ([
    ATTENDANCE_STATUS.ABSENT,
    ATTENDANCE_STATUS.WEEKLY_OFF,
    ATTENDANCE_STATUS.HOLIDAY,
    ATTENDANCE_STATUS.LEAVE,
    ATTENDANCE_STATUS.OD,
  ].includes(status)) return [];

  const times = getShiftTimes(shiftCode, date);
  if (!times) return [];

  // Add realistic jitter: ±15 min for IN, ±15 min for OUT
  const inJitter = randInt(-5, 20);   // slightly more late than early
  const outJitter = randInt(-15, 30); // can stay late for OT

  const inTime  = addMinutes(times.inTime,  inJitter);
  const outTime = addMinutes(times.outTime, outJitter);

  const punches = [];

  if (status === ATTENDANCE_STATUS.MISS_PUNCH) {
    // Only IN punch — no OUT
    punches.push({ type: 'IN', time: inTime });
    return punches;
  }

  if (status === ATTENDANCE_STATUS.HALF_DAY) {
    // Present for roughly half the shift
    const halfOut = addMinutes(times.inTime, times.durationMinutes / 2 + randInt(-20, 20));
    punches.push({ type: 'IN', time: inTime }, { type: 'OUT', time: halfOut });
    return punches;
  }

  // Normal full day
  punches.push({ type: 'IN', time: inTime }, { type: 'OUT', time: outTime });

  // 15% chance of a duplicate punch (real-world face recognition noise)
  if (Math.random() < 0.15) {
    punches.push({ type: 'IN', time: addMinutes(inTime, randInt(1, 3)) });
  }

  return punches;
}

function computeDailyRecord(emp, date, shiftCode, statusInfo, punches) {
  const { status, isWeeklyOff, isHoliday, leaveType, leaveId } = statusInfo;
  const shiftTimes = getShiftTimes(shiftCode, date);

  const inPunch  = punches.find(p => p.type === 'IN');
  const outPunch = punches.find(p => p.type === 'OUT');

  let workMinutes = 0, otMinutes = 0, lateMinutes = 0, earlyGoMinutes = 0;

  if (inPunch && outPunch && shiftTimes) {
    workMinutes = Math.max(0, (outPunch.time - inPunch.time) / 60000);

    // OT: work beyond shift end
    if (outPunch.time > shiftTimes.outTime) {
      otMinutes = (outPunch.time - shiftTimes.outTime) / 60000;
    }

    // Late arrival
    if (inPunch.time > shiftTimes.inTime) {
      lateMinutes = (inPunch.time - shiftTimes.inTime) / 60000;
    }

    // Early go
    if (outPunch.time < shiftTimes.outTime) {
      earlyGoMinutes = (shiftTimes.outTime - outPunch.time) / 60000;
    }
  }

  return {
    workMinutes:     Math.round(workMinutes),
    otMinutes:       Math.round(otMinutes),
    lateMinutes:     Math.round(lateMinutes),
    earlyGoMinutes:  Math.round(earlyGoMinutes),
    inTime:          inPunch?.time || null,
    outTime:         outPunch?.time || null,
    isMissPunch:     status === ATTENDANCE_STATUS.MISS_PUNCH,
    isWeeklyOff:     !!isWeeklyOff,
    isHoliday:       !!isHoliday,
    leaveType:       leaveType || null,
    leaveId:         leaveId || null,
  };
}

// ─── Main seeder ──────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱  HR Analytics — Seed Script');
  console.log('================================\n');

  await connect();

  if (RESET) {
    console.log('⚠️  Resetting all collections...');
    await Promise.all([
      Employee.deleteMany({}),
      PunchRaw.deleteMany({}),
      AttendanceDaily.deleteMany({}),
      AttendanceMonthly.deleteMany({}),
      Leave.deleteMany({}),
      ShiftSchedule.deleteMany({}),
      Holiday.deleteMany({}),
      User.deleteMany({}),
      AuditLog.deleteMany({}),
      JobLog.deleteMany({}),
    ]);
    console.log('   Collections cleared.\n');
  }

  const dates = getDateRange();
  console.log(`📅  Seeding ${SEED_DAYS} days: ${toDateStr(dates[0])} → ${toDateStr(dates[dates.length - 1])}`);

  // ── 1. System users ─────────────────────────────────────────────────────────
  console.log('\n👤  Creating system users...');
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const users = await User.insertMany([
    { name: 'Amit Khanna',   email: 'admin@steelplant.in',      password: passwordHash, role: ROLES.IT_ADMIN,    isActive: true },
    { name: 'Neha Sharma',   email: 'hr@steelplant.in',         password: passwordHash, role: ROLES.HR_ADMIN,    isActive: true },
    { name: 'Vikram Bose',   email: 'timeoffice@steelplant.in', password: passwordHash, role: ROLES.TIME_OFFICE, isActive: true },
  ], { ordered: false }).catch(() => console.log('   Users already exist, skipping.')) || [];

  if (users.length) {
    console.log(`   Created ${users.length} users`);
    console.log('   Credentials → email / password: Admin@123 (all users)');
  }

  // ── 2. Holidays ─────────────────────────────────────────────────────────────
  console.log('\n🎉  Creating holidays...');
  const holidayList = buildHolidayList(dates);
  if (holidayList.length) {
    await Holiday.insertMany(holidayList, { ordered: false })
      .catch(() => console.log('   Holidays already exist, skipping.'));
    console.log(`   Created ${holidayList.length} holidays`);
  }
  const holidaySet = new Set(holidayList.map(h => h.dateStr));

  // ── 3. Employees ─────────────────────────────────────────────────────────────
  console.log('\n👷  Creating employees...');
  const employeeDocs = EMPLOYEE_POOL.slice(0, EMPLOYEE_COUNT).map((e, i) => {
    const code = `EMP${String(1001 + i).padStart(4, '0')}`;
    const weeklyOff = { day1: 0, day2: null }; // Sunday for all; could vary
    return {
      ukgId:        `UKG${String(9001 + i).padStart(5, '0')}`,
      employeeCode: code,
      name:         e.name,
      email:        `${e.name.toLowerCase().replace(/\s+/g, '.')}@steelplant.in`,
      department:   e.dept,
      designation:  e.desig,
      category:     e.category,
      defaultShift: e.shift,
      weeklyOff,
      joiningDate:  new Date(2018 + randInt(0, 5), randInt(0, 11), randInt(1, 28)),
      status:       'Active',
      syncSource:   SYNC_SOURCE.SEED,
      ukgHash:      hash({ code, name: e.name }),
    };
  });

  await Employee.insertMany(employeeDocs, { ordered: false })
    .catch(() => console.log('   Employees already exist, skipping.'));

  const employees = await Employee.find({ status: 'Active' }).lean();
  console.log(`   ${employees.length} active employees`);

  // ── 4. Leaves ─────────────────────────────────────────────────────────────
  console.log('\n🏖️   Creating leave records...');
  const leaveTypes = Object.keys(LEAVE_TYPES);
  const leaveDocs = [];

  for (const emp of employees) {
    // Each employee gets 1–3 leave periods in the range
    const leaveCount = randInt(1, 3);
    for (let i = 0; i < leaveCount; i++) {
      const startDateIdx = randInt(0, dates.length - 5);
      const duration = randInt(1, 3);
      const from = dates[startDateIdx];
      const to = dates[Math.min(startDateIdx + duration - 1, dates.length - 1)];
      const lt = pick(leaveTypes);
      leaveDocs.push({
        employeeCode: emp.employeeCode,
        ukgId:        emp.ukgId,
        leaveType:    lt,
        leaveTypeLabel: LEAVE_TYPES[lt],
        fromDate:     from,
        toDate:       to,
        days:         duration,
        status:       'Approved',
        ukgLeaveId:   `LV${emp.ukgId}${startDateIdx}`,
        syncSource:   SYNC_SOURCE.SEED,
        ukgHash:      hash({ emp: emp.ukgId, from: toDateStr(from) }),
      });
    }
  }

  await Leave.insertMany(leaveDocs, { ordered: false })
    .catch(() => null);
  console.log(`   ${leaveDocs.length} leave records`);

  const allLeaves = await Leave.find({}).lean();
  const leavesByEmp = {};
  for (const l of allLeaves) {
    if (!leavesByEmp[l.employeeCode]) leavesByEmp[l.employeeCode] = [];
    leavesByEmp[l.employeeCode].push(l);
  }

  // ── 5. Attendance (punches + daily records) ───────────────────────────────
  console.log('\n⏰  Building attendance records...');
  let totalPunches = 0, totalDaily = 0;

  for (const emp of employees) {
    const punchBatch = [];
    const dailyBatch = [];

    for (const date of dates) {
      const shiftCode = emp.defaultShift;
      const statusInfo = computeStatus(emp, date, holidaySet, leavesByEmp[emp.employeeCode] || [], shiftCode);
      const rawPunches = buildPunches(emp, date, shiftCode, statusInfo.status);
      const computed = computeDailyRecord(emp, date, shiftCode, statusInfo, rawPunches);

      // Build raw punch docs
      for (const p of rawPunches) {
        punchBatch.push({
          ukgId:        emp.ukgId,
          employeeCode: emp.employeeCode,
          punchTime:    p.time,
          punchType:    p.type,
          deviceId:     `DEVICE_${String(randInt(1, 4)).padStart(2, '0')}`,
          isManual:     false,
          syncSource:   SYNC_SOURCE.SEED,
          ukgHash:      hash({ code: emp.employeeCode, time: p.time.toISOString(), type: p.type }),
        });
      }

      // Build daily attendance doc
      dailyBatch.push({
        employeeCode: emp.employeeCode,
        ukgId:        emp.ukgId,
        date:         date,
        dateStr:      toDateStr(date),
        shift:        shiftCode,
        status:       statusInfo.status,
        inTime:       computed.inTime,
        outTime:      computed.outTime,
        workMinutes:  computed.workMinutes,
        otMinutes:    computed.otMinutes,
        lateMinutes:  computed.lateMinutes,
        earlyGoMinutes: computed.earlyGoMinutes,
        leaveType:    computed.leaveType,
        leaveId:      computed.leaveId,
        isWeeklyOff:  computed.isWeeklyOff,
        isHoliday:    computed.isHoliday,
        isMissPunch:  computed.isMissPunch,
        syncSource:   SYNC_SOURCE.SEED,
        computedAt:   new Date(),
      });
    }

    // Insert in batches — ignore duplicate key errors (idempotent re-run)
    await PunchRaw.insertMany(punchBatch, { ordered: false }).catch(() => null);
    await AttendanceDaily.insertMany(dailyBatch, { ordered: false }).catch(() => null);

    totalPunches += punchBatch.length;
    totalDaily += dailyBatch.length;
  }

  console.log(`   ${totalPunches} punch records`);
  console.log(`   ${totalDaily} daily attendance records`);

  // ── 6. Monthly summaries ───────────────────────────────────────────────────
  console.log('\n📊  Building monthly summaries...');
  const monthlySummaries = [];

  // Group daily records by employee + month
  const allDaily = await AttendanceDaily.find({}).lean();
  const grouped = {};
  for (const d of allDaily) {
    const key = `${d.employeeCode}|${d.date.getFullYear()}|${d.date.getMonth() + 1}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  }

  for (const [key, records] of Object.entries(grouped)) {
    const [code, year, month] = key.split('|');
    const emp = employees.find(e => e.employeeCode === code);
    if (!emp) continue;

    const summary = {
      employeeCode: code,
      ukgId:        emp.ukgId,
      month:        parseInt(month),
      year:         parseInt(year),
      presentDays:   records.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length,
      absentDays:    records.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length,
      halfDays:      records.filter(r => r.status === ATTENDANCE_STATUS.HALF_DAY).length,
      leaveDays:     records.filter(r => r.status === ATTENDANCE_STATUS.LEAVE).length,
      weeklyOffDays: records.filter(r => r.status === ATTENDANCE_STATUS.WEEKLY_OFF).length,
      holidayDays:   records.filter(r => r.status === ATTENDANCE_STATUS.HOLIDAY).length,
      missPunchDays: records.filter(r => r.status === ATTENDANCE_STATUS.MISS_PUNCH).length,
      odDays:        records.filter(r => r.status === ATTENDANCE_STATUS.OD).length,
      totalWorkMinutes: records.reduce((s, r) => s + (r.workMinutes || 0), 0),
      totalOtMinutes:   records.reduce((s, r) => s + (r.otMinutes || 0), 0),
      totalLateMinutes: records.reduce((s, r) => s + (r.lateMinutes || 0), 0),
      builtAt: new Date(),
    };

    // Leave breakdown
    const leaveBreakdown = {};
    for (const r of records) {
      if (r.leaveType) leaveBreakdown[r.leaveType] = (leaveBreakdown[r.leaveType] || 0) + 1;
    }
    summary.leaveBreakdown = leaveBreakdown;
    monthlySummaries.push(summary);
  }

  await AttendanceMonthly.insertMany(monthlySummaries, { ordered: false }).catch(() => null);
  console.log(`   ${monthlySummaries.length} monthly summaries`);

  // ── 7. Seed job log entry ─────────────────────────────────────────────────
  await JobLog.create({
    jobName:          'seed',
    status:           'success',
    startedAt:        new Date(),
    endedAt:          new Date(),
    durationMs:       0,
    recordsProcessed: EMPLOYEE_COUNT * SEED_DAYS,
    recordsCreated:   totalDaily,
    meta:             { source: 'seed_script', employees: EMPLOYEE_COUNT, days: SEED_DAYS },
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n✅  Seed complete!\n');
  console.log('   Login credentials:');
  console.log('   ┌─────────────────────────────────────────────────────────┐');
  console.log('   │  IT Admin      admin@steelplant.in       Admin@123     │');
  console.log('   │  HR Admin      hr@steelplant.in          Admin@123     │');
  console.log('   │  Time Office   timeoffice@steelplant.in  Admin@123     │');
  console.log('   └─────────────────────────────────────────────────────────┘\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
