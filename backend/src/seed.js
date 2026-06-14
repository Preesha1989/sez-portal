// src/seed.js
// Populates the DB with demo users, SEZ team, and sample requests.
// Run AFTER migrate.js: node src/seed.js

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('./models/db');

const HASH = (pw) => bcrypt.hashSync(pw, 10);
const now = () => new Date().toISOString();

const seed = db.transaction(() => {

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = [
    // SEZ team (role: sez_team)
    { id: 'u-pn', name: 'Priya Nair',   email: 'priya@sez.internal',  dept: 'SEZ Unit', role: 'sez_team' },
    { id: 'u-rs', name: 'Ravi Sharma',  email: 'ravi@sez.internal',   dept: 'SEZ Unit', role: 'sez_team' },
    { id: 'u-ar', name: 'Anita Rao',    email: 'anita@sez.internal',  dept: 'SEZ Unit', role: 'sez_admin' },
    { id: 'u-kd', name: 'Kiran Das',    email: 'kiran@sez.internal',  dept: 'SEZ Unit', role: 'sez_team' },
    // Requesters (role: requester)
    { id: 'u-sk', name: 'Sanjay Kumar', email: 'sanjay@company.com',  dept: 'Logistics',   role: 'requester' },
    { id: 'u-kr', name: 'Kavitha Reddy',email: 'kavitha@company.com', dept: 'Logistics',   role: 'requester' },
    { id: 'u-mi', name: 'Meena Iyer',   email: 'meena@company.com',   dept: 'IT',          role: 'requester' },
    { id: 'u-sd', name: 'Shipping Dept',email: 'shipping@company.com',dept: 'Operations',  role: 'requester' },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, password, department, role, created_at, updated_at)
    VALUES (@id, @name, @email, @password, @dept, @role, @created_at, @updated_at)
  `);

  for (const u of users) {
    insertUser.run({ ...u, password: HASH('demo1234'), created_at: now(), updated_at: now() });
  }

  // ── SEZ Members ────────────────────────────────────────────────────────────
  const members = [
    { id: 'm-pn', user_id: 'u-pn', role_title: 'SEZ Officer',            speciality: 'Customs',       queue_count: 3 },
    { id: 'm-rs', user_id: 'u-rs', role_title: 'SEZ Officer',            speciality: 'Exports',       queue_count: 2 },
    { id: 'm-ar', user_id: 'u-ar', role_title: 'Senior Compliance Mgr',  speciality: 'All',           queue_count: 4 },
    { id: 'm-kd', user_id: 'u-kd', role_title: 'Documentation Executive',speciality: 'Documentation', queue_count: 1 },
  ];

  const insertMember = db.prepare(`
    INSERT OR IGNORE INTO sez_members (id, user_id, role_title, speciality, queue_count, created_at)
    VALUES (@id, @user_id, @role_title, @speciality, @queue_count, @created_at)
  `);
  for (const m of members) insertMember.run({ ...m, created_at: now() });

  // ── Sample Requests ────────────────────────────────────────────────────────
  const sampleRequests = [
    {
      id: 'SEZ-2026-043', idempotency_key: 'idem-043',
      request_type: 'LUT Renewal', request_category: 'COMPLIANCE', direction: 'both',
      requester_id: 'u-sk', department: 'Logistics', priority: 'High',
      status: 'Closed', assigned_to: 'm-ar',
      description: 'LUT renewal for FY 2026-27. GSTIN: 37AABCU9603R1Z2. Previous LUT: LUT/VSP/2025/0781.',
      dynamic_fields: JSON.stringify({ fy: '2026-27', gstin: '37AABCU9603R1Z2', prev_lut: 'LUT/VSP/2025/0781', expiry: '31-03-2026' }),
      reference_no: 'LUT/VSP/2026/0892',
      created_at: '2026-06-10T10:00:00.000Z', updated_at: '2026-06-12T10:20:00.000Z',
    },
    {
      id: 'SEZ-2026-044', idempotency_key: 'idem-044',
      request_type: 'RGP — Domestic Return', request_category: 'RGP', direction: 'both',
      requester_id: 'u-kr', department: 'Logistics', priority: 'Normal',
      status: 'In Review', assigned_to: 'm-kd',
      description: 'Job work return. Original RGP/2026/112. Vendor: Precision Metals, Hyderabad. Expected return by 20 Jun.',
      dynamic_fields: JSON.stringify({ original_rgp: 'RGP/2026/112', party: 'Precision Metals', sent_date: '01-06-2026', return_date: '20-06-2026' }),
      reference_no: 'RGP/2026/112',
      created_at: '2026-06-12T08:00:00.000Z', updated_at: '2026-06-13T11:05:00.000Z',
    },
    {
      id: 'SEZ-2026-045', idempotency_key: 'idem-045',
      request_type: 'Bond Execution', request_category: 'COMPLIANCE', direction: 'both',
      requester_id: 'u-mi', department: 'IT', priority: 'Normal',
      status: 'Pending', assigned_to: 'm-rs',
      description: 'B-17 running bond execution for import consignment. Value ₹50L. Bank guarantee from SBI.',
      dynamic_fields: JSON.stringify({ bond_type: 'B-17 Running Bond', value: '5000000', bank: 'SBI', validity: '31-03-2027' }),
      reference_no: null,
      created_at: '2026-06-13T09:00:00.000Z', updated_at: '2026-06-13T09:30:00.000Z',
    },
    {
      id: 'SEZ-2026-046', idempotency_key: 'idem-046',
      request_type: 'DTA Goods — Export to SEZ', request_category: 'DTA', direction: 'export',
      requester_id: 'u-sd', department: 'Operations', priority: 'Urgent',
      status: 'Approved', assigned_to: 'm-rs',
      description: 'DTA procurement INV/2026/345. HSN 8542. Value ₹12.4L. Supplier: Infosys Components Pvt Ltd.',
      dynamic_fields: JSON.stringify({ invoice_no: 'INV/2026/345', goods_desc: 'Electronic components', value: '1240000', hsn: '85421990' }),
      reference_no: 'INV/2026/345',
      created_at: '2026-06-13T15:22:00.000Z', updated_at: '2026-06-14T08:30:00.000Z',
    },
    {
      id: 'SEZ-2026-047', idempotency_key: 'idem-047',
      request_type: 'SEZ Unit Approval / Amendment', request_category: 'COMPLIANCE', direction: 'both',
      requester_id: 'u-mi', department: 'IT', priority: 'High',
      status: 'New', assigned_to: 'm-pn',
      description: 'Amendment to unit approval — adding AI software services as new product category. DC approval pending.',
      dynamic_fields: JSON.stringify({ unit_no: 'SEZ/VSP/2019/0042', amendment: 'Add AI software services', nfa_ref: '' }),
      reference_no: null,
      created_at: '2026-06-14T09:45:00.000Z', updated_at: '2026-06-14T09:47:00.000Z',
    },
  ];

  const insertReq = db.prepare(`
    INSERT OR IGNORE INTO requests
      (id, idempotency_key, request_type, request_category, direction, requester_id, department,
       priority, status, assigned_to, description, dynamic_fields, reference_no, created_at, updated_at)
    VALUES
      (@id, @idempotency_key, @request_type, @request_category, @direction, @requester_id, @department,
       @priority, @status, @assigned_to, @description, @dynamic_fields, @reference_no, @created_at, @updated_at)
  `);
  for (const r of sampleRequests) insertReq.run(r);

  // ── Seed audit entries ─────────────────────────────────────────────────────
  const insertAudit = db.prepare(`
    INSERT OR IGNORE INTO audit_log (id, request_id, actor_id, actor_name, action, old_value, new_value, created_at)
    VALUES (@id, @request_id, @actor_id, @actor_name, @action, @old_value, @new_value, @created_at)
  `);

  const auditSeeds = [
    { id: uuidv4(), request_id: 'SEZ-2026-043', actor_id: 'u-sk',  actor_name: 'Sanjay Kumar', action: 'REQUEST_CREATED',    old_value: null,        new_value: 'New',       created_at: '2026-06-10T10:00:00.000Z' },
    { id: uuidv4(), request_id: 'SEZ-2026-043', actor_id: 'u-ar',  actor_name: 'Anita Rao',    action: 'ASSIGNED',           old_value: null,        new_value: 'm-ar',      created_at: '2026-06-10T10:05:00.000Z' },
    { id: uuidv4(), request_id: 'SEZ-2026-043', actor_id: 'u-ar',  actor_name: 'Anita Rao',    action: 'STATUS_CHANGED',     old_value: 'New',       new_value: 'Approved',  created_at: '2026-06-12T10:15:00.000Z' },
    { id: uuidv4(), request_id: 'SEZ-2026-043', actor_id: 'u-ar',  actor_name: 'Anita Rao',    action: 'STATUS_CHANGED',     old_value: 'Approved',  new_value: 'Closed',    created_at: '2026-06-12T10:20:00.000Z' },
    { id: uuidv4(), request_id: 'SEZ-2026-044', actor_id: 'u-kr',  actor_name: 'Kavitha Reddy',action: 'REQUEST_CREATED',    old_value: null,        new_value: 'New',       created_at: '2026-06-12T08:00:00.000Z' },
    { id: uuidv4(), request_id: 'SEZ-2026-044', actor_id: 'u-kd',  actor_name: 'Kiran Das',    action: 'STATUS_CHANGED',     old_value: 'New',       new_value: 'In Review', created_at: '2026-06-13T11:05:00.000Z' },
    { id: uuidv4(), request_id: 'SEZ-2026-046', actor_id: 'u-rs',  actor_name: 'Ravi Sharma',  action: 'STATUS_CHANGED',     old_value: 'In Review', new_value: 'Approved',  created_at: '2026-06-14T08:30:00.000Z' },
    { id: uuidv4(), request_id: 'SEZ-2026-047', actor_id: 'u-mi',  actor_name: 'Meena Iyer',   action: 'REQUEST_CREATED',    old_value: null,        new_value: 'New',       created_at: '2026-06-14T09:45:00.000Z' },
    { id: uuidv4(), request_id: 'SEZ-2026-047', actor_id: 'u-pn',  actor_name: 'Priya Nair',   action: 'ASSIGNED',           old_value: null,        new_value: 'm-pn',      created_at: '2026-06-14T09:47:00.000Z' },
  ];
  for (const a of auditSeeds) insertAudit.run(a);

  // ── Seed comments ──────────────────────────────────────────────────────────
  const insertComment = db.prepare(`
    INSERT OR IGNORE INTO comments (id, request_id, author_id, author_name, body, created_at)
    VALUES (@id, @request_id, @author_id, @author_name, @body, @created_at)
  `);
  insertComment.run({ id: uuidv4(), request_id: 'SEZ-2026-043', author_id: 'u-ar', author_name: 'Anita Rao',   body: 'Processed and filed with GSTN. LUT number: LUT/VSP/2026/0892.', created_at: '2026-06-12T10:18:00.000Z' });
  insertComment.run({ id: uuidv4(), request_id: 'SEZ-2026-045', author_id: 'u-rs', author_name: 'Ravi Sharma', body: 'Sent to customs. Awaiting counter-signature from DC office.',    created_at: '2026-06-13T14:00:00.000Z' });

});

seed();
console.log('✅  Seed complete.');
db.close();
