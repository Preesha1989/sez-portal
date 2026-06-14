const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const pool = require('./models/db');

const HASH = (pw) => bcrypt.hashSync(pw, 10);
const now = () => new Date().toISOString();

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const users = [
      { id: 'u-pn', name: 'Priya Nair',    email: 'priya@sez.internal',  dept: 'SEZ Unit',    role: 'sez_team'  },
      { id: 'u-rs', name: 'Ravi Sharma',   email: 'ravi@sez.internal',   dept: 'SEZ Unit',    role: 'sez_team'  },
      { id: 'u-ar', name: 'Anita Rao',     email: 'anita@sez.internal',  dept: 'SEZ Unit',    role: 'sez_admin' },
      { id: 'u-kd', name: 'Kiran Das',     email: 'kiran@sez.internal',  dept: 'SEZ Unit',    role: 'sez_team'  },
      { id: 'u-sk', name: 'Sanjay Kumar',  email: 'sanjay@company.com',  dept: 'Logistics',   role: 'requester' },
      { id: 'u-kr', name: 'Kavitha Reddy', email: 'kavitha@company.com', dept: 'Logistics',   role: 'requester' },
      { id: 'u-mi', name: 'Meena Iyer',    email: 'meena@company.com',   dept: 'IT',          role: 'requester' },
      { id: 'u-sd', name: 'Shipping Dept', email: 'shipping@company.com',dept: 'Operations',  role: 'requester' },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, name, email, password, department, role, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
        [u.id, u.name, u.email, HASH('demo1234'), u.dept, u.role, now(), now()]
      );
    }

    const members = [
      { id: 'm-pn', user_id: 'u-pn', role_title: 'SEZ Officer',             speciality: 'Customs'       },
      { id: 'm-rs', user_id: 'u-rs', role_title: 'SEZ Officer',             speciality: 'Exports'       },
      { id: 'm-ar', user_id: 'u-ar', role_title: 'Senior Compliance Mgr',   speciality: 'All'           },
      { id: 'm-kd', user_id: 'u-kd', role_title: 'Documentation Executive', speciality: 'Documentation' },
    ];

    for (const m of members) {
      await client.query(
        `INSERT INTO sez_members (id, user_id, role_title, speciality, queue_count, created_at)
         VALUES ($1,$2,$3,$4,0,$5) ON CONFLICT (id) DO NOTHING`,
        [m.id, m.user_id, m.role_title, m.speciality, now()]
      );
    }

    const requests = [
      { id: 'SEZ-2026-043', type: 'LUT Renewal',                  cat: 'COMPLIANCE', dir: 'both',   req: 'u-sk', dept: 'Logistics',  pri: 'High',   status: 'Closed',    assigned: 'm-ar', desc: 'LUT renewal for FY 2026-27. GSTIN: 37AABCU9603R1Z2.' },
      { id: 'SEZ-2026-044', type: 'RGP — Domestic Return',        cat: 'RGP',        dir: 'both',   req: 'u-kr', dept: 'Logistics',  pri: 'Normal', status: 'In Review', assigned: 'm-kd', desc: 'Job work return. Original RGP/2026/112. Vendor: Precision Metals.' },
      { id: 'SEZ-2026-045', type: 'Bond Execution',               cat: 'COMPLIANCE', dir: 'both',   req: 'u-mi', dept: 'IT',         pri: 'Normal', status: 'Pending',   assigned: 'm-rs', desc: 'B-17 running bond. Value Rs 50L. Bank guarantee from SBI.' },
      { id: 'SEZ-2026-046', type: 'DTA Goods — Export to SEZ',    cat: 'DTA',        dir: 'export', req: 'u-sd', dept: 'Operations', pri: 'Urgent', status: 'Approved',  assigned: 'm-rs', desc: 'DTA procurement INV/2026/345. HSN 8542. Value Rs 12.4L.' },
      { id: 'SEZ-2026-047', type: 'SEZ Unit Approval / Amendment',cat: 'COMPLIANCE', dir: 'both',   req: 'u-mi', dept: 'IT',         pri: 'High',   status: 'New',       assigned: 'm-pn', desc: 'Amendment to add AI software services to unit approval.' },
    ];

    for (const r of requests) {
      await client.query(
        `INSERT INTO requests (id, idempotency_key, request_type, request_category, direction, requester_id, department, priority, status, assigned_to, description, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT (id) DO NOTHING`,
        [r.id, `idem-${r.id}`, r.type, r.cat, r.dir, r.req, r.dept, r.pri, r.status, r.assigned, r.desc, now(), now()]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Seed complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
};

seed();