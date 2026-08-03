import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SuperAdmin from './models/superAdmin.model';
import Plan from './models/plan.model';
import Commodity from './models/commodity.model';
import connectDB from './config/db';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing existing Super Admins...');
    await SuperAdmin.deleteMany({});

    console.log('Clearing existing Plans...');
    await Plan.deleteMany({});

    console.log('Clearing existing Commodities...');
    await Commodity.deleteMany({});

    console.log('Creating initial Super Admin account...');
    const admin = new SuperAdmin({
      email: 'admin@adat.com',
      passwordHash: 'admin',
      name: 'System Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
    });
    await admin.save();

    console.log('Creating initial Subscription Plans...');
    const plans = [
      {
        name: 'Trial Plan',
        price: 0,
        billingCycle: 'Monthly',
        features: { maxUsers: 2, maxWarehouses: 1 },
        isActive: true
      },
      {
        name: 'Standard Monthly',
        price: 1999,
        billingCycle: 'Monthly',
        features: { maxUsers: 5, maxWarehouses: 3 },
        isActive: true
      },
      {
        name: 'Enterprise Yearly',
        price: 19999,
        billingCycle: 'Yearly',
        features: { maxUsers: 20, maxWarehouses: 10 },
        isActive: true
      }
    ];
    await Plan.insertMany(plans);

    console.log('Creating global Commodities...');
    const commodities = [
      {
        name: 'Soybean',
        marathiName: 'सोयाबीन',
        englishName: 'Soybean',
        commodityCode: 'SOY01',
        category: 'Oilseeds',
        unit: 'KG',
        gstPercent: 5,
        status: 'Active'
      },
      {
        name: 'Cotton',
        marathiName: 'कापूस',
        englishName: 'Cotton',
        commodityCode: 'COT01',
        category: 'Fibre',
        unit: 'KG',
        gstPercent: 5,
        status: 'Active'
      },
      {
        name: 'Tur (Pigeon Peas)',
        marathiName: 'तूर',
        englishName: 'Tur',
        commodityCode: 'TUR01',
        category: 'Pulses',
        unit: 'KG',
        gstPercent: 0,
        status: 'Active'
      },
      {
        name: 'Chana (Gram)',
        marathiName: 'हरभरा',
        englishName: 'Chana',
        commodityCode: 'CHA01',
        category: 'Pulses',
        unit: 'KG',
        gstPercent: 0,
        status: 'Active'
      },
      {
        name: 'Groundnut',
        marathiName: 'भुईमूग',
        englishName: 'Groundnut',
        commodityCode: 'GNT01',
        category: 'Oilseeds',
        unit: 'KG',
        gstPercent: 5,
        status: 'Active'
      }
    ];
    await Commodity.insertMany(commodities);

    console.log('✅ Seeding completed successfully!');
    console.log('Super Admin -> Email: admin@adat.com, Password: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
