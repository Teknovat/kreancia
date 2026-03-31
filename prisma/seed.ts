import { PrismaClient, UserRole, CreditStatus, PaymentMethod } from '../src/generated/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create a demo merchant user
  const hashedPassword = await hash('merchant123', 10)

  const merchant = await prisma.user.upsert({
    where: { email: 'demo@merchant.com' },
    update: {},
    create: {
      email: 'demo@merchant.com',
      password: hashedPassword,
      name: 'Merchant Demo',
      role: UserRole.MERCHANT,
      businessName: 'Boutique Demo',
      businessAddress: '123 Rue de la Paix, 75001 Paris',
      phone: '+33 1 23 45 67 89',
      tenantId: 'tenant_demo',
    },
  })

  console.log('✅ Created demo merchant:', merchant.email)

  // Create demo clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Jean Dupont',
        email: 'jean.dupont@email.com',
        phone: '+33 6 12 34 56 78',
        address: '45 Avenue des Champs, 75008 Paris',
        businessName: 'SARL Dupont',
        creditLimit: 5000.00,
        paymentTermDays: 30,
        tenantId: 'tenant_demo',
        merchantId: merchant.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Marie Martin',
        email: 'marie.martin@email.com',
        phone: '+33 6 23 45 67 89',
        address: '12 Rue du Commerce, 69000 Lyon',
        businessName: 'Entreprise Martin',
        creditLimit: 3000.00,
        paymentTermDays: 15,
        tenantId: 'tenant_demo',
        merchantId: merchant.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Pierre Dubois',
        email: 'pierre.dubois@email.com',
        phone: '+33 6 34 56 78 90',
        address: '78 Boulevard Victor Hugo, 13000 Marseille',
        creditLimit: 2000.00,
        paymentTermDays: 45,
        tenantId: 'tenant_demo',
        merchantId: merchant.id,
      },
    }),
  ])

  console.log('✅ Created demo clients:', clients.length)

  // Create demo credits
  const credits = await Promise.all([
    // Jean Dupont - Multiple credits
    prisma.credit.create({
      data: {
        amount: 1500.00,
        description: 'Commande équipement bureau',
        dueDate: new Date('2026-05-01'),
        status: CreditStatus.PENDING,
        tenantId: 'tenant_demo',
        merchantId: merchant.id,
        clientId: clients[0].id,
      },
    }),
    prisma.credit.create({
      data: {
        amount: 800.00,
        description: 'Fournitures diverses',
        dueDate: new Date('2026-04-15'),
        status: CreditStatus.PARTIAL,
        tenantId: 'tenant_demo',
        merchantId: merchant.id,
        clientId: clients[0].id,
      },
    }),

    // Marie Martin - One credit
    prisma.credit.create({
      data: {
        amount: 2200.00,
        description: 'Matériel informatique',
        dueDate: new Date('2026-04-20'),
        status: CreditStatus.PENDING,
        tenantId: 'tenant_demo',
        merchantId: merchant.id,
        clientId: clients[1].id,
      },
    }),

    // Pierre Dubois - Overdue credit
    prisma.credit.create({
      data: {
        amount: 650.00,
        description: 'Services de consultation',
        dueDate: new Date('2026-03-15'), // Past due date
        status: CreditStatus.OVERDUE,
        tenantId: 'tenant_demo',
        merchantId: merchant.id,
        clientId: clients[2].id,
      },
    }),
  ])

  console.log('✅ Created demo credits:', credits.length)

  // Create demo payments
  const payments = await Promise.all([
    // Partial payment for Jean Dupont's second credit
    prisma.payment.create({
      data: {
        amount: 300.00,
        note: 'Acompte sur commande fournitures',
        method: PaymentMethod.BANK_TRANSFER,
        reference: 'VIR123456',
        tenantId: 'tenant_demo',
        merchantId: merchant.id,
        clientId: clients[0].id,
        creditId: credits[1].id,
        paidAt: new Date('2026-03-25'),
      },
    }),

    // Payment without specific credit (advance payment)
    prisma.payment.create({
      data: {
        amount: 500.00,
        note: 'Avance client',
        method: PaymentMethod.CASH,
        tenantId: 'tenant_demo',
        merchantId: merchant.id,
        clientId: clients[1].id,
        paidAt: new Date('2026-03-28'),
      },
    }),
  ])

  console.log('✅ Created demo payments:', payments.length)

  // Display summary
  console.log('\n📊 Database seeded successfully!')
  console.log(`📧 Demo login: ${merchant.email}`)
  console.log(`🔑 Demo password: merchant123`)
  console.log(`👥 Clients: ${clients.length}`)
  console.log(`💳 Credits: ${credits.length}`)
  console.log(`💰 Payments: ${payments.length}`)
  console.log('\n🚀 You can now start the application!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })