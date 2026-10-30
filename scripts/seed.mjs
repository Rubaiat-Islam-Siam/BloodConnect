/**
 * BloodConnect Database Seed Script
 * Run with: node scripts/seed.mjs
 *
 * Seeds:
 *  - 1 Admin user
 *  - 6 Donor users (various blood groups & locations in Bangladesh)
 *  - 4 Patient users
 *  - 6 Blood requests (various statuses)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';

// ── Load MONGODB_URI from .env.local ─────────────────────────────────────────
const envFile = readFileSync('.env.local', 'utf-8');
const uriLine = envFile.split('\n').find(l => l.startsWith('MONGODB_URI='));
if (!uriLine) {
  console.error('❌  MONGODB_URI not found in .env.local');
  process.exit(1);
}
const MONGODB_URI = uriLine.replace('MONGODB_URI=', '').trim();
console.log('🔗  Connecting to MongoDB...');

// ── Schema definitions (mirror src/models/) ───────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true, trim: true },
    email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:         { type: String, required: true },
    role:             { type: String, enum: ['PATIENT', 'DONOR', 'ADMIN'], default: 'PATIENT' },
    bloodGroup:       { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
    location:         { type: String, trim: true, default: '' },
    availableToDonate:{ type: Boolean, default: true },
  },
  { timestamps: true }
);

const BloodRequestSchema = new mongoose.Schema(
  {
    patientId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bloodGroup:     { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true },
    units:          { type: Number, required: true, min: 1 },
    location:       { type: String, required: true, trim: true },
    contactDetails: { type: String, trim: true, default: '' },
    status:         { type: String, enum: ['PENDING','APPROVED','REJECTED','FULFILLED'], default: 'PENDING' },
  },
  { timestamps: true }
);

const User         = mongoose.models.User         || mongoose.model('User',         UserSchema);
const BloodRequest = mongoose.models.BloodRequest || mongoose.model('BloodRequest', BloodRequestSchema);

// ── Seed Data ─────────────────────────────────────────────────────────────────
const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'Password123';   // all seed accounts share this password

async function hash(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function seed() {
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log('✅  Connected to MongoDB Atlas\n');

  // ── 1. Admin ──────────────────────────────────────────────────────────────
  const adminData = {
    name:     'Lab Administrator',
    email:    'admin@bloodconnect.com',
    password: await hash('AdminPassword123'),
    role:     'ADMIN',
    location: 'Dhaka',
  };

  // ── 2. Donors ─────────────────────────────────────────────────────────────
  const donorsData = [
    {
      name: 'Rahim Khan',
      email: 'rahim.khan@bloodconnect.com',
      password: await hash(DEFAULT_PASSWORD),
      role: 'DONOR',
      bloodGroup: 'O+',
      location: 'Dhanmondi, Dhaka',
      availableToDonate: true,
    },
    {
      name: 'Nadia Sultana',
      email: 'nadia.sultana@bloodconnect.com',
      password: await hash(DEFAULT_PASSWORD),
      role: 'DONOR',
      bloodGroup: 'A+',
      location: 'Gulshan, Dhaka',
      availableToDonate: true,
    },
    {
      name: 'Karim Ahmed',
      email: 'karim.ahmed@bloodconnect.com',
      password: await hash(DEFAULT_PASSWORD),
      role: 'DONOR',
      bloodGroup: 'B+',
      location: 'Agrabad, Chittagong',
      availableToDonate: true,
    },
    {
      name: 'Fatima Begum',
      email: 'fatima.begum@bloodconnect.com',
      password: await hash(DEFAULT_PASSWORD),
      role: 'DONOR',
      bloodGroup: 'AB+',
      location: 'Sylhet Sadar, Sylhet',
      availableToDonate: true,
    },
    {
      name: 'Sabbir Hossain',
      email: 'sabbir.hossain@bloodconnect.com',
      password: await hash(DEFAULT_PASSWORD),
      role: 'DONOR',
      bloodGroup: 'O-',
      location: 'Rajshahi Sadar, Rajshahi',
      availableToDonate: false,        // Currently unavailable (recently donated)
    },
    {
      name: 'Rupa Akter',
      email: 'rupa.akter@bloodconnect.com',
      password: await hash(DEFAULT_PASSWORD),
      role: 'DONOR',
      bloodGroup: 'B-',
      location: 'Mohammadpur, Dhaka',
      availableToDonate: true,
    },
  ];

  // ── 3. Patients ───────────────────────────────────────────────────────────
  const patientsData = [
    {
      name: 'Jasmine Chowdhury',
      email: 'jasmine.chowdhury@bloodconnect.com',
      password: await hash(DEFAULT_PASSWORD),
      role: 'PATIENT',
      bloodGroup: 'A+',
      location: 'Dhaka Medical College, Dhaka',
    },
    {
      name: 'Tanvir Islam',
      email: 'tanvir.islam@bloodconnect.com',
      password: await hash(DEFAULT_PASSWORD),
      role: 'PATIENT',
      bloodGroup: 'O+',
      location: 'Square Hospital, Dhaka',
    },
    {
      name: 'Mousumi Rahman',
      email: 'mousumi.rahman@bloodconnect.com',
      password: await hash(DEFAULT_PASSWORD),
      role: 'PATIENT',
      bloodGroup: 'B+',
      location: 'Chittagong Medical College Hospital',
    },
    {
      name: 'Arif Uddin',
      email: 'arif.uddin@bloodconnect.com',
      password: await hash(DEFAULT_PASSWORD),
      role: 'PATIENT',
      bloodGroup: 'AB-',
      location: 'BSMMU, Shahbag, Dhaka',
    },
  ];

  // ── Insert Users ──────────────────────────────────────────────────────────
  console.log('👤  Seeding Admin...');
  let admin;
  try {
    admin = await User.findOneAndUpdate(
      { email: adminData.email },
      adminData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`   ✓ Admin: ${admin.name} <${admin.email}>`);
  } catch (e) {
    console.warn(`   ⚠ Admin skipped: ${e.message}`);
  }

  console.log('\n🩸  Seeding Donors...');
  const insertedDonors = [];
  for (const d of donorsData) {
    try {
      const donor = await User.findOneAndUpdate(
        { email: d.email },
        d,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      insertedDonors.push(donor);
      const avail = donor.availableToDonate ? '🟢 Available' : '🔴 Unavailable';
      console.log(`   ✓ ${donor.name} — ${donor.bloodGroup} — ${donor.location} — ${avail}`);
    } catch (e) {
      console.warn(`   ⚠ Donor ${d.name} skipped: ${e.message}`);
    }
  }

  console.log('\n🏥  Seeding Patients...');
  const insertedPatients = [];
  for (const p of patientsData) {
    try {
      const patient = await User.findOneAndUpdate(
        { email: p.email },
        p,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      insertedPatients.push(patient);
      console.log(`   ✓ ${patient.name} <${patient.email}>`);
    } catch (e) {
      console.warn(`   ⚠ Patient ${p.name} skipped: ${e.message}`);
    }
  }

  // ── Blood Requests ─────────────────────────────────────────────────────────
  if (insertedPatients.length < 4) {
    console.warn('\n⚠  Not enough patients inserted — skipping blood requests.');
    await mongoose.disconnect();
    return;
  }

  const [jasmine, tanvir, mousumi, arif] = insertedPatients;

  const requestsData = [
    {
      patientId:      jasmine._id,
      bloodGroup:     'A+',
      units:          2,
      location:       'Dhaka Medical College Hospital, Ward 4',
      contactDetails: 'Attendant: 01711-000001',
      status:         'PENDING',
    },
    {
      patientId:      jasmine._id,
      bloodGroup:     'A+',
      units:          1,
      location:       'Dhaka Medical College Hospital, Emergency Ward',
      contactDetails: 'Attendant: 01711-000001',
      status:         'APPROVED',
    },
    {
      patientId:      tanvir._id,
      bloodGroup:     'O+',
      units:          3,
      location:       'Square Hospital, 18/F Bir Uttam Qazi Nuruzzaman Sarak, Dhaka',
      contactDetails: 'Dr. Rahman — 01722-000002',
      status:         'APPROVED',
    },
    {
      patientId:      mousumi._id,
      bloodGroup:     'B+',
      units:          2,
      location:       'Chittagong Medical College Hospital, Block B',
      contactDetails: 'Attendant: 01733-000003',
      status:         'PENDING',
    },
    {
      patientId:      arif._id,
      bloodGroup:     'AB-',
      units:          1,
      location:       'BSMMU (Bangabandhu Sheikh Mujib Medical University), Shahbag, Dhaka',
      contactDetails: 'ICU contact: 01744-000004',
      status:         'FULFILLED',
    },
    {
      patientId:      tanvir._id,
      bloodGroup:     'O+',
      units:          2,
      location:       'National Heart Foundation Hospital, Mirpur, Dhaka',
      contactDetails: '',
      status:         'REJECTED',
    },
  ];

  console.log('\n📋  Seeding Blood Requests...');
  for (const r of requestsData) {
    try {
      // Avoid duplicate requests on re-run by checking patientId + bloodGroup + location combo
      const exists = await BloodRequest.findOne({
        patientId: r.patientId,
        location:  r.location,
        status:    r.status,
      });

      if (exists) {
        console.log(`   ⟳ Already exists (${r.status}): ${r.bloodGroup} — ${r.location.slice(0, 45)}...`);
        continue;
      }

      const req = await BloodRequest.create(r);
      console.log(`   ✓ [${req.status.padEnd(9)}]  ${req.bloodGroup} × ${req.units}u  →  ${req.location.slice(0, 45)}`);
    } catch (e) {
      console.warn(`   ⚠ Request skipped: ${e.message}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalUsers    = await User.countDocuments();
  const totalRequests = await BloodRequest.countDocuments();

  console.log('\n════════════════════════════════════════════');
  console.log('🎉  Seed complete!');
  console.log(`   Total Users in DB    : ${totalUsers}`);
  console.log(`   Total Requests in DB : ${totalRequests}`);
  console.log('════════════════════════════════════════════');
  console.log('\nDefault password for all seed accounts: Password123');
  console.log('Admin password: AdminPassword123');
  console.log('\nYou can log in at http://localhost:3000/login\n');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});

