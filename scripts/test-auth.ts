#!/usr/bin/env node

/**
 * Test script to verify merchant authentication works
 * This script tests that created merchants can authenticate properly
 */

import { PrismaClient } from '../src/generated/client'
import bcrypt from 'bcryptjs'

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

/**
 * Test merchant authentication
 */
async function testMerchantAuth(email: string, password: string): Promise<boolean> {
  const prisma = new PrismaClient()

  try {
    console.log(`${colors.cyan}Testing authentication for: ${email}${colors.reset}`)

    // Find merchant by email (same as auth.ts)
    const user = await prisma.merchant.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        businessName: true,
        createdAt: true
      }
    })

    if (!user || !user.password) {
      console.log(`${colors.red}❌ Merchant not found or no password set${colors.reset}`)
      return false
    }

    console.log(`${colors.yellow}Found merchant: ${user.name}${colors.reset}`)

    // Test password verification (same as auth.ts)
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      console.log(`${colors.red}❌ Password verification failed${colors.reset}`)
      return false
    }

    console.log(`${colors.green}✅ Password verification successful${colors.reset}`)
    console.log(`${colors.cyan}User object that would be returned by NextAuth:${colors.reset}`)
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      merchantId: user.id,
      businessName: user.businessName
    })

    return true

  } catch (error) {
    console.error(`${colors.red}❌ Authentication test failed:${colors.reset}`, error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log(`\n${colors.bright}${colors.blue}🔐 Merchant Authentication Test${colors.reset}\n`)

  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.log(`${colors.yellow}Usage: npm run test-auth <email> <password>${colors.reset}`)
    console.log(`${colors.yellow}Example: npm run test-auth test@merchant.com "TestPass123!"${colors.reset}`)
    process.exit(1)
  }

  const success = await testMerchantAuth(email, password)

  if (success) {
    console.log(`\n${colors.green}🎉 Authentication test PASSED${colors.reset}`)
    console.log(`${colors.cyan}The merchant can log in to the application successfully.${colors.reset}`)
  } else {
    console.log(`\n${colors.red}❌ Authentication test FAILED${colors.reset}`)
    console.log(`${colors.red}The merchant cannot log in. Check credentials or account setup.${colors.reset}`)
    process.exit(1)
  }
}

// Run the test
if (require.main === module) {
  main().catch((error) => {
    console.error(`${colors.red}❌ Test script failed:${colors.reset}`, error)
    process.exit(1)
  })
}