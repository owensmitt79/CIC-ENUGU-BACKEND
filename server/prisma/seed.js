import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CIC Alumni Portal Database Seed...');

  // 1. Seed SuperAdmin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cicalumni1995.org';
  const adminPassword = process.env.ADMIN_PASSWORD || 'cicEnuguAdmin1995!';
  const adminPin = process.env.ADMIN_PIN || '1995';

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const pinHash = await bcrypt.hash(adminPin, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: process.env.ADMIN_NAME || 'Secretariat SuperAdmin',
        passwordHash,
        pinHash,
        role: 'SUPERADMIN',
        phone: '+234 803 123 4567',
        isActive: true
      }
    });
    console.log(`✅ SuperAdmin user seeded: ${adminEmail}`);
  } else {
    console.log(`ℹ️ SuperAdmin user already exists: ${adminEmail}`);
  }

  // 2. Seed System Configuration
  const existingConfig = await prisma.systemConfig.findUnique({
    where: { id: 'default_config' }
  });

  if (!existingConfig) {
    await prisma.systemConfig.create({
      data: {
        id: 'default_config',
        associationName: 'CIC ALUMNI 1995 SET',
        slogan: 'Connecting the Past. Building the Future.',
        monthlyDuesRate: 5000,
        annualDuesRate: 25000,
        reunionFeeRate: 15000,
        activeGateway: 'Paystack',
        gatewayMode: 'Test Mode',
        bankName: 'First Heritage Bank',
        accountNumber: '1029384756',
        accountName: 'CIC Alumni 1995 Set National',
        ussdPrefix: '*737*50*5000#'
      }
    });
    console.log('✅ System configuration seeded.');
  }

  // 3. Seed Default Payment Categories
  const categories = [
    { id: 'monthly_dues', name: 'Monthly Dues', type: 'monthly', baseAmount: 5000, active: true, description: 'Mandatory monthly welfare and operations dues.' },
    { id: 'annual_dues', name: 'Annual Dues', type: 'fixed', baseAmount: 25000, active: true, description: 'One-time annual alumni registration and membership dues.' },
    { id: 'development_levy', name: 'Development Levy', type: 'fixed', baseAmount: 10000, active: true, description: 'Special contribution towards school infrastructure and grounds.' },
    { id: 'welfare_contribution', name: 'Welfare Contribution', type: 'custom', baseAmount: 5000, active: true, description: 'Voluntary support fund for alumni welfare and emergency assistance.' },
    { id: 'donation', name: 'Donation', type: 'custom', baseAmount: 10000, active: true, description: 'General philanthropy and endowment donations for the association.' },
    { id: 'project_contribution', name: 'Project Contribution', type: 'custom', baseAmount: 20000, active: true, description: 'Direct financing of ongoing alumni school rehabilitation projects.' },
    { id: 'event_registration', name: 'Event Registration', type: 'fixed', baseAmount: 5000, active: true, description: 'Participation and registration tickets for alumni gatherings.' },
    { id: 'reunion_fee', name: 'Reunion Fee', type: 'fixed', baseAmount: 15000, active: true, description: 'Comprehensive registration and package for the Grand Alumni Reunion.' },
    { id: 'special_levy', name: 'Special Levy', type: 'custom', baseAmount: 5000, active: true, description: 'Executive council authorized special project assessment.' },
    { id: 'other_payments', name: 'Other Payments', type: 'custom', baseAmount: 5000, active: true, description: 'Miscellaneous alumni association fees and contributions.' }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, type: cat.type, baseAmount: cat.baseAmount, description: cat.description },
      create: cat
    });
  }
  console.log(`✅ Seeded ${categories.length} payment categories.`);

  // 4. Seed Initial Leadership Council
  const leadershipRoster = [
    {
      id: 'lead-01',
      name: 'Engr. Emeka Okoye',
      role: 'President',
      office: 'Office of the President',
      bio: 'Chartered Civil Engineer and Infrastructure Consultant with over 20 years leadership experience. Leading the 1995 Set with strategic focus on infrastructure renewal and member solidarity.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      order: 1,
      email: 'president@cicalumni1995.org',
      phone: '+234 803 111 2233'
    },
    {
      id: 'lead-02',
      name: 'Dr. Chidi Nwosu',
      role: 'Vice President',
      office: 'Executive Directorate',
      bio: 'Senior Consultant Physician and Healthcare Administrator. Oversees executive committee initiatives, alumni welfare coordination, and strategic institutional outreach.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      order: 2,
      email: 'vicepresident@cicalumni1995.org',
      phone: '+234 803 222 3344'
    },
    {
      id: 'lead-03',
      name: 'Barr. Obinna Eze',
      role: 'General Secretary',
      office: 'National Secretariat Desk',
      bio: 'Commercial Litigation Attorney and Corporate Governance Specialist. Responsible for institutional statutory records, correspondence, and executive council administration.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      order: 3,
      email: 'secretary@cicalumni1995.org',
      phone: '+234 803 333 4455'
    },
    {
      id: 'lead-04',
      name: 'Mr. Kenneth Agu, FCA',
      role: 'Financial Secretary',
      office: 'Treasury & Audit Directorate',
      bio: 'Fellow of the Institute of Chartered Accountants of Nigeria (FCA). Manages alumni dues accounting, zero-login ledger reconciliation, and audited annual balance sheets.',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      order: 4,
      email: 'finsec@cicalumni1995.org',
      phone: '+234 803 444 5566'
    },
    {
      id: 'lead-05',
      name: 'Chief Uche Nnamani',
      role: 'Treasurer',
      office: 'Treasury & Custodial Management',
      bio: 'Investment Banker and Asset Manager. Custodian of association funds, ensuring strict adherence to budgetary authorizations and endowment capital growth.',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      order: 5,
      email: 'treasurer@cicalumni1995.org',
      phone: '+234 803 555 6677'
    },
    {
      id: 'lead-06',
      name: 'Mr. Jude Onah',
      role: 'Public Relations Officer',
      office: 'Media & Communications Unit',
      bio: 'Brand Strategist and Digital Communications Director. Coordinates public relations, digital publications, press releases, and alumni media relations.',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      order: 6,
      email: 'pro@cicalumni1995.org',
      phone: '+234 803 666 7788'
    },
    {
      id: 'lead-07',
      name: 'Pastor Chukwuma Ibe',
      role: 'Welfare Officer',
      office: 'Welfare & Brotherhood Bureau',
      bio: 'Community Care Advocate and Counselor. Dedicated to member wellness, bereavement support, fraternal outreach, and emergency benevolence aid.',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      order: 7,
      email: 'welfare@cicalumni1995.org',
      phone: '+234 803 777 8899'
    }
  ];

  for (const lead of leadershipRoster) {
    await prisma.leadership.upsert({
      where: { id: lead.id },
      update: lead,
      create: lead
    });
  }
  console.log(`✅ Seeded ${leadershipRoster.length} leadership council officers.`);

  // 5. Seed Projects
  const projects = [
    {
      id: 'prj-01',
      title: 'Ultra-Modern STEM & Computer Robotics Laboratory',
      category: 'Technology',
      status: 'active',
      targetAmount: 25000000,
      raisedAmount: 18450000,
      donorCount: 42,
      image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80',
      description: 'Equipping the college with 60 high-performance workstations, fiber internet, 3D printing equipment, and certified robotics curriculum to prepare young students for 21st-century technological leadership.'
    },
    {
      id: 'prj-02',
      title: 'College Solar Micro-Grid & 24/7 Power Security',
      category: 'Infrastructure',
      status: 'active',
      targetAmount: 15000000,
      raisedAmount: 11200000,
      donorCount: 35,
      image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
      description: 'Installation of a 30kVA hybrid industrial solar inverter system with tier-1 lithium batteries, powering the assembly hall, science blocks, and library with uninterrupted renewable electricity.'
    },
    {
      id: 'prj-03',
      title: 'Class of 1995 Indigent Students Scholarship Endowment',
      category: 'Scholarship',
      status: 'active',
      targetAmount: 8000000,
      raisedAmount: 6500000,
      donorCount: 28,
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
      description: 'Endowment fund providing full tuition coverage, textbooks, and boarding allowances for 20 academically brilliant yet indigent students across JSS1 through SS3.'
    }
  ];

  for (const prj of projects) {
    await prisma.project.upsert({
      where: { id: prj.id },
      update: prj,
      create: prj
    });
  }
  console.log(`✅ Seeded ${projects.length} capital projects.`);

  // 6. Seed Sample Members
  const sampleMembers = [
    {
      id: 'mem-1995-001',
      name: 'Engr. Emeka Okoye',
      email: 'emeka.okoye@sample.com',
      phone: '+234 803 111 2233',
      chapter: 'Lagos',
      profession: 'Civil Engineering',
      duesStatus: 'Up to Date',
      bio: '1995 Graduating Class. Lagos Chapter Coordinator & President.'
    },
    {
      id: 'mem-1995-002',
      name: 'Dr. Chidi Nwosu',
      email: 'chidi.nwosu@sample.com',
      phone: '+234 803 222 3344',
      chapter: 'Enugu',
      profession: 'Medicine & Surgery',
      duesStatus: 'Up to Date',
      bio: 'Enugu Chapter stalwart and Vice President.'
    },
    {
      id: 'mem-1995-003',
      name: 'Barr. Obinna Eze',
      email: 'obinna.eze@sample.com',
      phone: '+234 803 333 4455',
      chapter: 'Abuja FCT',
      profession: 'Legal Practice',
      duesStatus: 'Up to Date',
      bio: 'Abuja Chapter legal adviser and General Secretary.'
    },
    {
      id: 'mem-1995-004',
      name: 'Engr. Nnamdi Kanu',
      email: 'nnamdi.kanu@sample.com',
      phone: '+44 791 234 5678',
      chapter: 'Diaspora',
      profession: 'Cloud Architecture & DevOps',
      duesStatus: 'Up to Date',
      bio: 'United Kingdom Chapter Alumni Liaison.'
    },
    {
      id: 'mem-1995-005',
      name: 'Chief Uche Nnamani',
      email: 'uche.nnamani@sample.com',
      phone: '+234 803 555 6677',
      chapter: 'Enugu',
      profession: 'Investment Banking',
      duesStatus: 'Up to Date',
      bio: 'Treasurer and active benefactor.'
    }
  ];

  for (const m of sampleMembers) {
    await prisma.member.upsert({
      where: { email: m.email },
      update: m,
      create: m
    });
  }
  console.log(`✅ Seeded ${sampleMembers.length} sample alumni members.`);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
