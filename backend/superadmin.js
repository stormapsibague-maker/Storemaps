/**
 * STOREMAPS — Crear Super Admin
 * Ejecutar UNA SOLA VEZ con: node crear-superadmin.js
 * Luego puedes eliminarlo por seguridad.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Company = require('./models/Company');

// ══════════════════════════════════════════
//  CREDENCIALES DEL SUPER ADMIN — CÁMBIALAS
// ══════════════════════════════════════════
const SUPERADMIN = {
  email: 'superadmin@storemaps.co',
  password: 'Storemaps@Admin2026!',
  companyName: 'Super Administrador',
  legalRep: 'Administrador Principal',
  phone: '3100000000',
  address: 'Ibagué, Colombia',
  nit: 'SUPERADMIN-001',
  type: 'superadmin'
};

async function crearSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe
    const existing = await Company.findOne({ email: SUPERADMIN.email });
    if (existing) {
      if (existing.type !== 'superadmin') {
        existing.type = 'superadmin';
        await existing.save();
        console.log('✅ Cuenta actualizada a superadmin:', SUPERADMIN.email);
      } else {
        console.log('ℹ️  El superadmin ya existe:', SUPERADMIN.email);
      }
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(SUPERADMIN.password, 10);

    const superadmin = new Company({
      email: SUPERADMIN.email,
      password: hashedPassword,
      companyName: SUPERADMIN.companyName,
      legalRep: SUPERADMIN.legalRep,
      phone: SUPERADMIN.phone,
      address: SUPERADMIN.address,
      nit: SUPERADMIN.nit,
      type: 'superadmin',
      verified: true,
      verificationLevel: 'premium',
      isBlocked: false
    });

    await superadmin.save();

    console.log('\n🎉 ¡Super Admin creado exitosamente!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ', SUPERADMIN.email);
    console.log('🔑 Password: ', SUPERADMIN.password);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Guarda estas credenciales en un lugar seguro.');
    console.log('⚠️  Puedes eliminar este archivo ahora.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

crearSuperAdmin();