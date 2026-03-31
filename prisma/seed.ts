import { PrismaClient, CreditStatus, PaymentMethod } from '../src/generated/client'
import { hash } from 'bcryptjs'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create a demo merchant
  const hashedPassword = await hash('merchant123', 10)

  const merchant = await prisma.merchant.upsert({
    where: { email: 'demo@merchant.com' },
    update: {},
    create: {
      email: 'demo@merchant.com',
      password: hashedPassword,
      name: 'Merchant Demo',
      currency: 'TND',
      businessName: 'Boutique Demo',
      businessAddress: '123 Rue de la Paix, 1000 Tunis',
      phone: '+216 71 123 456',
    },
  })

  console.log('✅ Created demo merchant:', merchant.email)

  // Create demo clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        firstName: 'Ahmed',
        lastName: 'Ben Salem',
        email: 'ahmed.bensalem@email.com',
        phone: '+216 20 123 456',
        address: '45 Avenue Habib Bourguiba, 1000 Tunis',
        businessName: 'SARL Ben Salem',
        creditLimit: new Decimal('5000.00'),
        paymentTermDays: 30,
        merchantId: merchant.id,
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Fatima',
        lastName: 'Karray',
        email: 'fatima.karray@email.com',
        phone: '+216 21 234 567',
        address: '12 Rue de la République, 3000 Sfax',
        businessName: 'Entreprise Karray',
        creditLimit: new Decimal('3000.00'),
        paymentTermDays: 15,
        merchantId: merchant.id,
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Mehdi',
        lastName: 'Trabelsi',
        email: 'mehdi.trabelsi@email.com',
        phone: '+216 22 345 678',
        address: '78 Boulevard du 14 Janvier, 4000 Sousse',
        businessName: 'EURL Trabelsi',
        creditLimit: new Decimal('2000.00'),
        paymentTermDays: 45,
        merchantId: merchant.id,
      },
    }),
  ])

  console.log('✅ Created demo clients:', clients.length)

  // Create demo credits
  const credits = await Promise.all([
    // Ahmed Ben Salem - Multiple credits
    prisma.credit.create({
      data: {
        label: 'CMD-2026-001',
        totalAmount: new Decimal('1500.00'),
        remainingAmount: new Decimal('1500.00'),
        description: 'Commande équipement bureau',
        dueDate: new Date('2026-05-01'),
        status: CreditStatus.OPEN,
        merchantId: merchant.id,
        clientId: clients[0].id,
      },
    }),
    prisma.credit.create({
      data: {
        label: 'CMD-2026-002',
        totalAmount: new Decimal('800.00'),
        remainingAmount: new Decimal('500.00'),
        description: 'Fournitures diverses',
        dueDate: new Date('2026-04-15'),
        status: CreditStatus.OPEN,
        merchantId: merchant.id,
        clientId: clients[0].id,
      },
    }),

    // Fatima Karray - One credit
    prisma.credit.create({
      data: {
        label: 'CMD-2026-003',
        totalAmount: new Decimal('2200.00'),
        remainingAmount: new Decimal('1700.00'),
        description: 'Matériel informatique',
        dueDate: new Date('2026-04-20'),
        status: CreditStatus.OPEN,
        merchantId: merchant.id,
        clientId: clients[1].id,
      },
    }),

    // Mehdi Trabelsi - Overdue credit
    prisma.credit.create({
      data: {
        label: 'CMD-2026-004',
        totalAmount: new Decimal('650.00'),
        remainingAmount: new Decimal('650.00'),
        description: 'Services de consultation',
        dueDate: new Date('2026-03-15'), // Past due date
        status: CreditStatus.OVERDUE,
        merchantId: merchant.id,
        clientId: clients[2].id,
      },
    }),

    // Fully paid credit for demonstration
    prisma.credit.create({
      data: {
        label: 'CMD-2026-005',
        totalAmount: new Decimal('400.00'),
        remainingAmount: new Decimal('0.00'),
        description: 'Matériel de bureau',
        dueDate: new Date('2026-03-30'),
        status: CreditStatus.PAID,
        merchantId: merchant.id,
        clientId: clients[0].id,
      },
    }),
  ])

  console.log('✅ Created demo credits:', credits.length)

  // Create demo payments
  const payments = await Promise.all([
    // Partial payment for Ahmed's second credit
    prisma.payment.create({
      data: {
        amount: new Decimal('300.00'),
        note: 'Acompte sur commande fournitures',
        method: PaymentMethod.BANK_TRANSFER,
        reference: 'VIR123456',
        paymentDate: new Date('2026-03-25'),
        merchantId: merchant.id,
        clientId: clients[0].id,
      },
    }),

    // Payment for Fatima
    prisma.payment.create({
      data: {
        amount: new Decimal('500.00'),
        note: 'Paiement partiel matériel informatique',
        method: PaymentMethod.CASH,
        paymentDate: new Date('2026-03-28'),
        merchantId: merchant.id,
        clientId: clients[1].id,
      },
    }),

    // Full payment for CMD-2026-005
    prisma.payment.create({
      data: {
        amount: new Decimal('400.00'),
        note: 'Paiement complet matériel bureau',
        method: PaymentMethod.CHECK,
        reference: 'CHK789',
        paymentDate: new Date('2026-03-20'),
        merchantId: merchant.id,
        clientId: clients[0].id,
      },
    }),
  ])

  console.log('✅ Created demo payments:', payments.length)

  // Create payment allocations to demonstrate FIFO system
  const paymentAllocations = await Promise.all([
    // Allocate first payment (300 TND) to Ahmed's second credit (CMD-2026-002)
    prisma.paymentAllocation.create({
      data: {
        amount: new Decimal('300.00'),
        allocatedAmount: new Decimal('300.00'),
        merchantId: merchant.id,
        clientId: clients[0].id,
        paymentId: payments[0].id,
        creditId: credits[1].id,
      },
    }),

    // Allocate second payment (500 TND) to Fatima's credit (CMD-2026-003)
    prisma.paymentAllocation.create({
      data: {
        amount: new Decimal('500.00'),
        allocatedAmount: new Decimal('500.00'),
        merchantId: merchant.id,
        clientId: clients[1].id,
        paymentId: payments[1].id,
        creditId: credits[2].id,
      },
    }),

    // Allocate third payment (400 TND) to fully paid credit (CMD-2026-005)
    prisma.paymentAllocation.create({
      data: {
        amount: new Decimal('400.00'),
        allocatedAmount: new Decimal('400.00'),
        merchantId: merchant.id,
        clientId: clients[0].id,
        paymentId: payments[2].id,
        creditId: credits[4].id,
      },
    }),
  ])

  console.log('✅ Created payment allocations:', paymentAllocations.length)

  // Display summary
  console.log('\n📊 Database seeded successfully!')
  console.log(`📧 Demo login: ${merchant.email}`)
  console.log(`🔑 Demo password: merchant123`)
  console.log(`👥 Clients: ${clients.length}`)
  console.log(`💳 Credits: ${credits.length}`)
  console.log(`💰 Payments: ${payments.length}`)
  console.log(`🔄 Payment Allocations: ${paymentAllocations.length}`)
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