// src/lib/requestTypes.js
// Single source of truth for all request types, their categories,
// directions, icons, colours, and dynamic fields.

export const REQUEST_TYPES = [
  // ── DTA ────────────────────────────────────────────────────────────────
  {
    id: 'DTA_GOODS_EXPORT',
    label: 'DTA Goods — Export to SEZ',
    sub: 'DTA goods procured and moved into SEZ unit',
    category: 'DTA', direction: 'export',
    color: 'blue', icon: '📦',
    fields: [
      { key: 'invoice_no',   label: 'Supplier Invoice No.',  placeholder: 'INV/2026/xxx' },
      { key: 'goods_desc',   label: 'Goods description',      placeholder: 'e.g. Electronic components' },
      { key: 'value',        label: 'Invoice value (INR)',     placeholder: '₹' },
      { key: 'hsn',          label: 'HSN code',               placeholder: '8-digit HSN' },
    ],
  },
  {
    id: 'DTA_SERVICES_EXPORT',
    label: 'DTA Services — Export to SEZ',
    sub: 'Service procurement from DTA into SEZ',
    category: 'DTA', direction: 'export',
    color: 'blue', icon: '🔧',
    fields: [
      { key: 'so_no',    label: 'Service order / PO No.',  placeholder: 'SO/2026/xxx' },
      { key: 'svc_type', label: 'Nature of service',        placeholder: 'e.g. IT development services' },
      { key: 'value',    label: 'Value (INR)',               placeholder: '₹' },
      { key: 'gstin',    label: 'GSTIN of supplier',        placeholder: '27XXXXX' },
    ],
  },
  {
    id: 'DTA_GOODS_IMPORT',
    label: 'DTA Goods — Import from SEZ',
    sub: 'Clearance of goods from SEZ to DTA on payment of duty',
    category: 'DTA', direction: 'import',
    color: 'teal', icon: '🏭',
    fields: [
      { key: 'be_no',      label: 'Bill of Entry No.',     placeholder: 'BE/2026/xxx' },
      { key: 'goods_desc', label: 'Goods description',      placeholder: '' },
      { key: 'value',      label: 'Assessable value (INR)', placeholder: '₹' },
      { key: 'duty',       label: 'Duty amount (if known)', placeholder: '₹' },
    ],
  },
  {
    id: 'DTA_SERVICES_IMPORT',
    label: 'DTA Services — Import from SEZ',
    sub: 'Service receipts from SEZ unit to DTA',
    category: 'DTA', direction: 'import',
    color: 'teal', icon: '📡',
    fields: [
      { key: 'invoice_no', label: 'Invoice / Reference No.', placeholder: 'INV/2026/xxx' },
      { key: 'svc_type',   label: 'Nature of service',        placeholder: '' },
      { key: 'value',      label: 'Value (INR)',               placeholder: '₹' },
    ],
  },

  // ── RGP ────────────────────────────────────────────────────────────────
  {
    id: 'RGP_DOMESTIC',
    label: 'RGP — Domestic Return',
    sub: 'Job work / repair within India — goods returning to SEZ',
    category: 'RGP', direction: 'both',
    color: 'amber', icon: '🔄',
    fields: [
      { key: 'original_rgp', label: 'Original RGP No.',         placeholder: 'RGP/2026/xxx' },
      { key: 'party',        label: 'Job worker / vendor name',  placeholder: '' },
      { key: 'sent_date',    label: 'Date sent out',             placeholder: 'DD-MM-YYYY' },
      { key: 'return_date',  label: 'Expected return date',      placeholder: 'DD-MM-YYYY' },
    ],
  },
  {
    id: 'RGP_ABROAD',
    label: 'RGP — Return from Abroad',
    sub: 'Goods sent overseas for repair or exhibition, now returning',
    category: 'RGP', direction: 'import',
    color: 'purple', icon: '✈️',
    fields: [
      { key: 'sb_no',       label: 'Original Shipping Bill No.', placeholder: 'SB/2026/xxx' },
      { key: 'country',     label: 'Country sent to',            placeholder: 'e.g. Germany' },
      { key: 'purpose',     label: 'Purpose (repair/exhibition)',placeholder: '' },
      { key: 'return_date', label: 'Expected return date',       placeholder: 'DD-MM-YYYY' },
    ],
  },

  // ── NRGP ───────────────────────────────────────────────────────────────
  {
    id: 'NRGP_DOMESTIC',
    label: 'NRGP — Domestic Disposal',
    sub: 'Goods sent domestically — scrapping, disposal, or permanent transfer',
    category: 'NRGP', direction: 'both',
    color: 'coral', icon: '🗂️',
    fields: [
      { key: 'nrgp_ref', label: 'NRGP reference / GR No.',  placeholder: '' },
      { key: 'party',    label: 'Receiving party name',       placeholder: '' },
      { key: 'reason',   label: 'Reason for non-return',     placeholder: 'e.g. Scrap, write-off, sale' },
      { key: 'value',    label: 'Book value (INR)',           placeholder: '₹' },
    ],
  },
  {
    id: 'NRGP_ABROAD',
    label: 'NRGP — Abroad Disposal',
    sub: 'Permanent export — goods not expected to return from overseas',
    category: 'NRGP', direction: 'export',
    color: 'coral', icon: '🌐',
    fields: [
      { key: 'sb_no',   label: 'Shipping Bill No.',        placeholder: 'SB/2026/xxx' },
      { key: 'country', label: 'Destination country',      placeholder: '' },
      { key: 'reason',  label: 'Reason for permanent export',placeholder: '' },
      { key: 'value',   label: 'Export value (USD)',        placeholder: '$' },
    ],
  },

  // ── Compliance ─────────────────────────────────────────────────────────
  {
    id: 'LUT_RENEWAL',
    label: 'LUT Renewal',
    sub: 'Annual Letter of Undertaking — IGST-free export',
    category: 'COMPLIANCE', direction: 'both',
    color: 'green', icon: '📋',
    fields: [
      { key: 'fy',       label: 'Financial year',           placeholder: 'e.g. 2026-27' },
      { key: 'gstin',    label: 'GSTIN',                    placeholder: '27XXXXX' },
      { key: 'prev_lut', label: 'Previous LUT No.',         placeholder: '' },
      { key: 'expiry',   label: 'Expiry of current LUT',    placeholder: 'DD-MM-YYYY' },
    ],
  },
  {
    id: 'BOND_EXECUTION',
    label: 'Bond Execution',
    sub: 'Customs bond for import / re-export transactions',
    category: 'COMPLIANCE', direction: 'both',
    color: 'green', icon: '📜',
    fields: [
      { key: 'bond_type', label: 'Bond type',               placeholder: 'e.g. B-17, Running Bond' },
      { key: 'value',     label: 'Bond value (INR)',         placeholder: '₹' },
      { key: 'bank',      label: 'Bank guarantee / surety', placeholder: '' },
      { key: 'validity',  label: 'Validity required till',  placeholder: 'DD-MM-YYYY' },
    ],
  },
  {
    id: 'RCMC',
    label: 'RCMC Certificate',
    sub: 'FIEO registration / renewal for export entities',
    category: 'COMPLIANCE', direction: 'both',
    color: 'green', icon: '🏅',
    fields: [
      { key: 'epc',    label: 'Export Promotion Council', placeholder: 'e.g. FIEO, CHEMEXCIL' },
      { key: 'iec',    label: 'IEC code',                 placeholder: '0000000000' },
      { key: 'expiry', label: 'Certificate expiry',       placeholder: 'DD-MM-YYYY' },
    ],
  },
  {
    id: 'SEZ_APPROVAL',
    label: 'SEZ Unit Approval / Amendment',
    sub: 'Fresh approval or changes to existing SEZ unit letter',
    category: 'COMPLIANCE', direction: 'both',
    color: 'purple', icon: '🏢',
    fields: [
      { key: 'unit_no',   label: 'SEZ Unit No.',                    placeholder: 'SEZ/VSP/2019/0042' },
      { key: 'amendment', label: 'Amendment / new product category', placeholder: '' },
      { key: 'nfa_ref',   label: 'NFA / DC approval ref (if any)',  placeholder: '' },
    ],
  },
  {
    id: 'SHIPPING_BILL',
    label: 'Shipping Bill Filing',
    sub: 'Shipping bill, packing list, invoice submission',
    category: 'COMPLIANCE', direction: 'export',
    color: 'teal', icon: '🚢',
    fields: [
      { key: 'invoice_no', label: 'Export Invoice No.',   placeholder: 'INV/EXP/2026/xxx' },
      { key: 'country',    label: 'Destination country',  placeholder: '' },
      { key: 'fob_value',  label: 'FOB value (USD)',       placeholder: '$' },
      { key: 'port',       label: 'Port of shipment',      placeholder: 'e.g. Visakhapatnam' },
    ],
  },
  {
    id: 'OTHER',
    label: 'Other SEZ Compliance',
    sub: 'Miscellaneous SEZ or customs compliance requirement',
    category: 'COMPLIANCE', direction: 'both',
    color: 'purple', icon: '📁',
    fields: [
      { key: 'ref',     label: 'Reference No. (if any)', placeholder: '' },
      { key: 'subject', label: 'Subject / brief title',  placeholder: '' },
    ],
  },
];

export const CATEGORIES = [
  { id: 'DTA',        label: 'DTA Transactions',          desc: 'Domestic Tariff Area ↔ SEZ' },
  { id: 'RGP',        label: 'Return of Goods (RGP)',     desc: 'Goods sent out and returning' },
  { id: 'NRGP',       label: 'Non-Return of Goods (NRGP)',desc: 'Goods sent out permanently' },
  { id: 'COMPLIANCE', label: 'Compliance Filings',        desc: 'LUT, Bond, RCMC, Approvals' },
];

export const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-700',   border: 'border-blue-200',  tag: 'bg-blue-100 text-blue-800' },
  teal:   { bg: 'bg-teal-50',   icon: 'text-teal-700',   border: 'border-teal-200',  tag: 'bg-teal-100 text-teal-800' },
  amber:  { bg: 'bg-amber-50',  icon: 'text-amber-700',  border: 'border-amber-200', tag: 'bg-amber-100 text-amber-800' },
  coral:  { bg: 'bg-red-50',    icon: 'text-red-700',    border: 'border-red-200',   tag: 'bg-red-100 text-red-800' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-700',  border: 'border-green-200', tag: 'bg-green-100 text-green-800' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-700', border: 'border-purple-200',tag: 'bg-purple-100 text-purple-800' },
};

export const STATUS_STYLES = {
  New:         'bg-purple-100 text-purple-800',
  Pending:     'bg-amber-100  text-amber-800',
  'In Review': 'bg-blue-100   text-blue-800',
  Approved:    'bg-green-100  text-green-800',
  Rejected:    'bg-red-100    text-red-800',
  Closed:      'bg-gray-100   text-gray-700',
};

export const PRIORITY_STYLES = {
  Normal: 'text-gray-600',
  High:   'text-amber-700 font-medium',
  Urgent: 'text-red-700 font-medium',
};

export const STATUSES = ['New','Pending','In Review','Approved','Rejected','Closed'];

export function getTypeById(id) {
  return REQUEST_TYPES.find(t => t.id === id);
}
export function getTypeByLabel(label) {
  return REQUEST_TYPES.find(t => t.label === label);
}
