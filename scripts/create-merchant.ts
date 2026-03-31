#!/usr/bin/env node

/**
 * CLI script for creating merchant accounts
 * Supports both interactive and non-interactive modes
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import * as readline from 'readline'
import { getMerchantManager, cleanup } from './lib/merchant-manager'
import {
  SUPPORTED_CURRENCIES,
  fieldValidators,
  getPasswordStrengthFeedback,
  type SupportedCurrency,
  type MerchantAccountData
} from './lib/validation'

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
}

// CLI interface
interface CliOptions {
  email?: string
  name?: string
  password?: string
  currency?: SupportedCurrency
  businessName?: string
  businessAddress?: string
  phone?: string
  interactive?: boolean
  help?: boolean
  list?: boolean
  limit?: number
  verbose?: boolean
}

/**
 * Parse command line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const options: CliOptions = {
    interactive: true, // Default to interactive mode
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true
        break

      case '--email':
      case '-e':
        options.email = args[++i]
        options.interactive = false
        break

      case '--name':
      case '-n':
        options.name = args[++i]
        options.interactive = false
        break

      case '--password':
      case '-p':
        options.password = args[++i]
        options.interactive = false
        break

      case '--currency':
      case '-c':
        options.currency = args[++i] as SupportedCurrency
        options.interactive = false
        break

      case '--business-name':
      case '-b':
        options.businessName = args[++i]
        options.interactive = false
        break

      case '--business-address':
      case '-a':
        options.businessAddress = args[++i]
        options.interactive = false
        break

      case '--phone':
        options.phone = args[++i]
        options.interactive = false
        break

      case '--non-interactive':
      case '--batch':
        options.interactive = false
        break

      case '--list':
      case '-l':
        options.list = true
        break

      case '--limit':
        options.limit = parseInt(args[++i]) || 10
        break

      case '--verbose':
      case '-v':
        options.verbose = true
        break

      default:
        if (arg.startsWith('--')) {
          const [key, value] = arg.split('=')
          const cleanKey = key.replace('--', '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
          if (value !== undefined) {
            ;(options as any)[cleanKey] = value
            options.interactive = false
          }
        }
        break
    }
  }

  return options
}

/**
 * Display help information
 */
function showHelp() {
  const packageJson = JSON.parse(
    readFileSync(join(__dirname, '..', 'package.json'), 'utf8')
  )

  console.log(`
${colors.bright}${colors.blue}Kreancia Merchant Account Manager v${packageJson.version}${colors.reset}
${colors.cyan}Create and manage merchant accounts for the multi-tenant credit management system${colors.reset}

${colors.bright}USAGE:${colors.reset}
  npm run create-merchant [options]
  npm run create-merchant -- --email=merchant@example.com --name="John Doe"

${colors.bright}OPTIONS:${colors.reset}
  ${colors.green}-h, --help${colors.reset}                    Show this help message
  ${colors.green}-e, --email${colors.reset}                   Merchant email address (required)
  ${colors.green}-n, --name${colors.reset}                    Merchant name (required)
  ${colors.green}-p, --password${colors.reset}               Password (if not provided, will be prompted)
  ${colors.green}-c, --currency${colors.reset}               Currency (${SUPPORTED_CURRENCIES.join(', ')})
  ${colors.green}-b, --business-name${colors.reset}          Business name (optional)
  ${colors.green}-a, --business-address${colors.reset}       Business address (optional)
  ${colors.green}    --phone${colors.reset}                  Phone number in international format (optional)
  ${colors.green}    --non-interactive${colors.reset}        Run in batch mode without prompts
  ${colors.green}-l, --list${colors.reset}                   List existing merchants
  ${colors.green}    --limit${colors.reset}                  Limit number of results for --list (default: 10)
  ${colors.green}-v, --verbose${colors.reset}                Enable verbose output

${colors.bright}EXAMPLES:${colors.reset}
  # Interactive mode (default)
  npm run create-merchant

  # Non-interactive mode with all required fields
  npm run create-merchant -- --email=john@store.com --name="John Doe" --password="SecurePass123!" --currency=EUR

  # With business information
  npm run create-merchant -- --email=jane@boutique.tn --name="Jane Smith" --business-name="Jane's Boutique" --currency=TND

  # List existing merchants
  npm run create-merchant -- --list --limit=20

${colors.bright}SUPPORTED CURRENCIES:${colors.reset}
  ${SUPPORTED_CURRENCIES.map(curr => `${colors.yellow}${curr}${colors.reset}`).join(', ')}

${colors.bright}SECURITY:${colors.reset}
  • Passwords are automatically hashed using bcrypt
  • Email uniqueness is enforced
  • Strong password requirements are validated
  • All database operations use Row Level Security (RLS)
`)
}

/**
 * Create readline interface for interactive input
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
}

/**
 * Prompt user for input with validation
 */
function promptInput(
  rl: readline.Interface,
  question: string,
  validator?: (input: string) => string | null,
  hideInput = false
): Promise<string> {
  return new Promise((resolve) => {
    const askQuestion = () => {
      rl.question(question, (answer) => {
        const trimmed = answer.trim()

        if (validator) {
          const error = validator(trimmed)
          if (error) {
            console.log(`${colors.red}❌ ${error}${colors.reset}`)
            askQuestion()
            return
          }
        }

        resolve(trimmed)
      })
    }

    askQuestion()
  })
}

/**
 * Interactive merchant creation
 */
async function createMerchantInteractive(): Promise<MerchantAccountData> {
  const rl = createReadlineInterface()

  console.log(`\n${colors.bright}${colors.blue}🏪 Create New Merchant Account${colors.reset}`)
  console.log(`${colors.cyan}Please provide the following information:${colors.reset}\n`)

  try {
    // Email
    const email = await promptInput(
      rl,
      `${colors.yellow}📧 Email address: ${colors.reset}`,
      fieldValidators.email
    )

    // Check if merchant already exists
    const merchantManager = getMerchantManager()
    const existsResult = await merchantManager.checkMerchantExists(email)
    if (existsResult.exists) {
      console.log(`${colors.red}❌ Merchant with email '${email}' already exists!${colors.reset}`)
      console.log(`   Created: ${existsResult.merchant?.createdAt}`)
      process.exit(1)
    }

    // Name
    const name = await promptInput(
      rl,
      `${colors.yellow}👤 Merchant name: ${colors.reset}`,
      fieldValidators.name
    )

    // Password with strength feedback
    let password: string
    while (true) {
      password = await promptInput(
        rl,
        `${colors.yellow}🔒 Password: ${colors.reset}`,
        (pwd) => {
          if (!pwd) return 'Password is required'
          const strength = getPasswordStrengthFeedback(pwd)
          if (!strength.isValid) {
            return `Weak password. Missing: ${strength.feedback.join(', ')}`
          }
          return null
        },
        true
      )
      break
    }

    // Currency
    console.log(`\n${colors.cyan}💱 Available currencies: ${SUPPORTED_CURRENCIES.join(', ')}${colors.reset}`)
    const currency = await promptInput(
      rl,
      `${colors.yellow}💱 Currency (default: TND): ${colors.reset}`,
      (curr) => {
        if (!curr) return null // Allow empty for default
        return fieldValidators.currency(curr.toUpperCase())
      }
    ) as SupportedCurrency || 'TND'

    // Optional fields
    console.log(`\n${colors.cyan}📋 Optional business information:${colors.reset}`)

    const businessName = await promptInput(
      rl,
      `${colors.yellow}🏢 Business name (optional): ${colors.reset}`,
      (name) => name ? fieldValidators.businessName(name) : null
    )

    const businessAddress = await promptInput(
      rl,
      `${colors.yellow}📍 Business address (optional): ${colors.reset}`
    )

    const phone = await promptInput(
      rl,
      `${colors.yellow}📞 Phone (+country code, optional): ${colors.reset}`,
      fieldValidators.phone
    )

    rl.close()

    return {
      email,
      name,
      password,
      currency: currency.toUpperCase() as SupportedCurrency,
      businessName: businessName || undefined,
      businessAddress: businessAddress || undefined,
      phone: phone || undefined,
    }
  } finally {
    rl.close()
  }
}

/**
 * List existing merchants
 */
async function listMerchants(limit = 10, verbose = false) {
  console.log(`\n${colors.bright}${colors.blue}📋 Existing Merchants${colors.reset}\n`)

  const merchantManager = getMerchantManager()
  const result = await merchantManager.listMerchants({ limit })

  if (result.merchants.length === 0) {
    console.log(`${colors.yellow}No merchants found.${colors.reset}`)
    return
  }

  console.log(`${colors.cyan}Found ${result.merchants.length} of ${result.total} merchants:${colors.reset}\n`)

  result.merchants.forEach((merchant, index) => {
    console.log(`${colors.bright}${index + 1}. ${merchant.name}${colors.reset}`)
    console.log(`   📧 ${merchant.email}`)
    console.log(`   💱 ${merchant.currency}`)
    if (merchant.businessName) {
      console.log(`   🏢 ${merchant.businessName}`)
    }
    console.log(`   📅 Created: ${merchant.createdAt.toLocaleDateString()}`)
    if (verbose) {
      console.log(`   🆔 ID: ${merchant.id}`)
    }
    console.log()
  })

  if (result.total > limit) {
    console.log(`${colors.cyan}... and ${result.total - limit} more merchants${colors.reset}`)
    console.log(`${colors.yellow}Use --limit to see more results${colors.reset}`)
  }
}

/**
 * Main execution function
 */
async function main() {
  const options = parseArgs()

  // Handle help
  if (options.help) {
    showHelp()
    return
  }

  // Handle list
  if (options.list) {
    try {
      await listMerchants(Number(options.limit) || 10, options.verbose)
    } catch (error) {
      console.error(`${colors.red}❌ Failed to list merchants:${colors.reset}`, error)
      process.exit(1)
    }
    return
  }

  try {
    const merchantManager = getMerchantManager()

    // Test database connection
    const isConnected = await merchantManager.testConnection()
    if (!isConnected) {
      console.error(`${colors.red}❌ Cannot connect to database. Please check your configuration.${colors.reset}`)
      process.exit(1)
    }

    let merchantData: MerchantAccountData

    if (options.interactive) {
      // Interactive mode
      merchantData = await createMerchantInteractive()
    } else {
      // Non-interactive mode
      if (!options.email || !options.name) {
        console.error(`${colors.red}❌ Email and name are required in non-interactive mode${colors.reset}`)
        console.error(`Use --help for more information`)
        process.exit(1)
      }

      // Prompt for password if not provided
      if (!options.password) {
        const rl = createReadlineInterface()
        options.password = await promptInput(
          rl,
          `${colors.yellow}🔒 Password for ${options.email}: ${colors.reset}`,
          fieldValidators.password,
          true
        )
        rl.close()
      }

      merchantData = {
        email: options.email,
        name: options.name,
        password: options.password,
        currency: options.currency || 'TND',
        businessName: options.businessName,
        businessAddress: options.businessAddress,
        phone: options.phone,
      }
    }

    // Create the merchant
    console.log(`\n${colors.cyan}🔄 Creating merchant account...${colors.reset}`)

    const result = await merchantManager.createMerchant(merchantData)

    if (result.success && result.merchant) {
      console.log(`\n${colors.bright}${colors.green}✅ Merchant account created successfully!${colors.reset}\n`)
      console.log(`${colors.cyan}Account Details:${colors.reset}`)
      console.log(`   📧 Email: ${result.merchant.email}`)
      console.log(`   👤 Name: ${result.merchant.name}`)
      console.log(`   💱 Currency: ${result.merchant.currency}`)
      if (result.merchant.businessName) {
        console.log(`   🏢 Business: ${result.merchant.businessName}`)
      }
      console.log(`   🆔 ID: ${result.merchant.id}`)
      console.log(`   📅 Created: ${result.merchant.createdAt.toLocaleString()}`)

      console.log(`\n${colors.yellow}🔐 The merchant can now log in at: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login${colors.reset}`)
    } else {
      console.log(`\n${colors.red}❌ Failed to create merchant account:${colors.reset}`)
      result.errors?.forEach(error => {
        console.log(`   ${colors.red}• ${error}${colors.reset}`)
      })
      process.exit(1)
    }

  } catch (error) {
    console.error(`\n${colors.red}❌ Unexpected error:${colors.reset}`, error)
    if (options.verbose) {
      console.error(error)
    }
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(`\n\n${colors.yellow}🛑 Operation cancelled by user${colors.reset}`)
  await cleanup()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await cleanup()
  process.exit(0)
})

// Run the script
if (require.main === module) {
  main()
    .catch(async (error) => {
      console.error(`${colors.red}❌ Script failed:${colors.reset}`, error)
      await cleanup()
      process.exit(1)
    })
    .finally(async () => {
      await cleanup()
    })
}