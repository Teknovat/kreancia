#!/usr/bin/env node

/**
 * CLI script for managing existing merchant accounts
 * Supports listing, updating, and deleting merchants
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import * as readline from 'readline'
import { getMerchantManager, cleanup } from './lib/merchant-manager'
import { fieldValidators, getPasswordStrengthFeedback } from './lib/validation'

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
}

interface CliOptions {
  list?: boolean
  details?: string
  updatePassword?: string
  delete?: string
  limit?: number
  verbose?: boolean
  help?: boolean
  confirm?: boolean
}

/**
 * Parse command line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const options: CliOptions = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true
        break

      case '--list':
      case '-l':
        options.list = true
        break

      case '--details':
      case '-d':
        options.details = args[++i]
        break

      case '--update-password':
      case '-p':
        options.updatePassword = args[++i]
        break

      case '--delete':
        options.delete = args[++i]
        break

      case '--limit':
        options.limit = parseInt(args[++i]) || 10
        break

      case '--verbose':
      case '-v':
        options.verbose = true
        break

      case '--confirm':
      case '-y':
        options.confirm = true
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
${colors.bright}${colors.blue}Kreancia Merchant Manager v${packageJson.version}${colors.reset}
${colors.cyan}Manage existing merchant accounts${colors.reset}

${colors.bright}USAGE:${colors.reset}
  npm run manage-merchants [options]

${colors.bright}OPTIONS:${colors.reset}
  ${colors.green}-h, --help${colors.reset}                    Show this help message
  ${colors.green}-l, --list${colors.reset}                   List all merchants
  ${colors.green}-d, --details${colors.reset} <email>        Show detailed information for a merchant
  ${colors.green}-p, --update-password${colors.reset} <email> Update merchant password
  ${colors.green}    --delete${colors.reset} <email>         Delete merchant account (dangerous!)
  ${colors.green}    --limit${colors.reset} <number>         Limit results for --list (default: 10)
  ${colors.green}-v, --verbose${colors.reset}                Enable verbose output
  ${colors.green}-y, --confirm${colors.reset}                Skip confirmation prompts (use with caution)

${colors.bright}EXAMPLES:${colors.reset}
  # List all merchants
  npm run manage-merchants -- --list

  # Show detailed info for a specific merchant
  npm run manage-merchants -- --details demo@merchant.com

  # Update merchant password
  npm run manage-merchants -- --update-password demo@merchant.com

  # Delete merchant (with confirmation)
  npm run manage-merchants -- --delete old@merchant.com

  # List more merchants
  npm run manage-merchants -- --list --limit 50

${colors.bright}${colors.red}⚠️  DANGER ZONE:${colors.reset}
  ${colors.red}--delete${colors.reset} permanently removes merchant and ALL related data
  This includes clients, credits, payments, and allocations!
  Use with extreme caution and ensure you have backups.
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
 * Prompt user for input
 */
function promptInput(
  rl: readline.Interface,
  question: string,
  validator?: (input: string) => string | null
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
 * List merchants with details
 */
async function listMerchants(limit = 10, verbose = false) {
  console.log(`\n${colors.bright}${colors.blue}📋 Merchant Accounts${colors.reset}\n`)

  const merchantManager = getMerchantManager()
  const result = await merchantManager.listMerchants({
    limit,
    orderBy: 'createdAt',
    orderDirection: 'desc',
  })

  if (result.merchants.length === 0) {
    console.log(`${colors.yellow}No merchant accounts found.${colors.reset}`)
    return
  }

  console.log(`${colors.cyan}Showing ${result.merchants.length} of ${result.total} merchants:${colors.reset}\n`)

  result.merchants.forEach((merchant, index) => {
    console.log(`${colors.bright}${index + 1}. ${merchant.name}${colors.reset}`)
    console.log(`   📧 Email: ${merchant.email}`)
    console.log(`   💱 Currency: ${merchant.currency}`)
    if (merchant.businessName) {
      console.log(`   🏢 Business: ${merchant.businessName}`)
    }
    console.log(`   📅 Created: ${merchant.createdAt.toLocaleString()}`)
    if (verbose) {
      console.log(`   🆔 ID: ${merchant.id}`)
    }
    console.log()
  })

  if (result.total > limit) {
    console.log(`${colors.cyan}📄 ${result.total - limit} more merchants available${colors.reset}`)
    console.log(`${colors.yellow}Use --limit ${result.total} to see all merchants${colors.reset}`)
  }
}

/**
 * Show detailed merchant information
 */
async function showMerchantDetails(email: string) {
  console.log(`\n${colors.bright}${colors.blue}🔍 Merchant Details${colors.reset}\n`)

  const merchantManager = getMerchantManager()
  const existsResult = await merchantManager.checkMerchantExists(email)

  if (!existsResult.exists) {
    console.log(`${colors.red}❌ Merchant with email '${email}' not found${colors.reset}`)
    return
  }

  const merchant = await merchantManager.getMerchantById(existsResult.merchant!.id)

  if (!merchant) {
    console.log(`${colors.red}❌ Failed to fetch merchant details${colors.reset}`)
    return
  }

  console.log(`${colors.cyan}Account Information:${colors.reset}`)
  console.log(`   🆔 ID: ${merchant.id}`)
  console.log(`   📧 Email: ${merchant.email}`)
  console.log(`   👤 Name: ${merchant.name}`)
  console.log(`   💱 Currency: ${merchant.currency}`)

  if (merchant.businessName) {
    console.log(`   🏢 Business Name: ${merchant.businessName}`)
  }

  if (merchant.businessAddress) {
    console.log(`   📍 Business Address: ${merchant.businessAddress}`)
  }

  if (merchant.phone) {
    console.log(`   📞 Phone: ${merchant.phone}`)
  }

  console.log(`   📅 Created: ${merchant.createdAt.toLocaleString()}`)
  console.log(`   📝 Updated: ${merchant.updatedAt.toLocaleString()}`)

  // TODO: Add statistics about clients, credits, etc. when those features are implemented
  console.log(`\n${colors.yellow}💡 Use the main application to view client and credit statistics${colors.reset}`)
}

/**
 * Update merchant password
 */
async function updateMerchantPassword(email: string) {
  console.log(`\n${colors.bright}${colors.blue}🔒 Update Merchant Password${colors.reset}\n`)

  const merchantManager = getMerchantManager()
  const existsResult = await merchantManager.checkMerchantExists(email)

  if (!existsResult.exists) {
    console.log(`${colors.red}❌ Merchant with email '${email}' not found${colors.reset}`)
    return
  }

  console.log(`${colors.cyan}Updating password for: ${existsResult.merchant!.name} (${email})${colors.reset}`)

  const rl = createReadlineInterface()

  try {
    // Get new password with validation
    let newPassword: string
    while (true) {
      newPassword = await promptInput(
        rl,
        `\n${colors.yellow}🔒 New password: ${colors.reset}`,
        (pwd) => {
          if (!pwd) return 'Password is required'
          const strength = getPasswordStrengthFeedback(pwd)
          if (!strength.isValid) {
            console.log(`${colors.yellow}Password strength: ${strength.score}/5${colors.reset}`)
            return `Weak password. Missing: ${strength.feedback.join(', ')}`
          }
          console.log(`${colors.green}✅ Strong password${colors.reset}`)
          return null
        }
      )
      break
    }

    // Confirm update
    const confirm = await promptInput(
      rl,
      `\n${colors.yellow}⚠️  Confirm password update for ${email}? (yes/no): ${colors.reset}`,
      (input) => {
        const lower = input.toLowerCase()
        if (!['yes', 'y', 'no', 'n'].includes(lower)) {
          return 'Please enter yes or no'
        }
        return null
      }
    )

    if (!['yes', 'y'].includes(confirm.toLowerCase())) {
      console.log(`${colors.yellow}🚫 Password update cancelled${colors.reset}`)
      return
    }

    console.log(`\n${colors.cyan}🔄 Updating password...${colors.reset}`)

    const result = await merchantManager.updateMerchantPassword(email, newPassword)

    if (result.success) {
      console.log(`${colors.green}✅ Password updated successfully!${colors.reset}`)
      console.log(`${colors.cyan}The merchant can now log in with the new password.${colors.reset}`)
    } else {
      console.log(`${colors.red}❌ Failed to update password:${colors.reset}`)
      result.errors?.forEach(error => {
        console.log(`   ${colors.red}• ${error}${colors.reset}`)
      })
    }

  } finally {
    rl.close()
  }
}

/**
 * Delete merchant account
 */
async function deleteMerchant(email: string, skipConfirm = false) {
  console.log(`\n${colors.bright}${colors.red}🗑️  Delete Merchant Account${colors.reset}\n`)

  const merchantManager = getMerchantManager()
  const existsResult = await merchantManager.checkMerchantExists(email)

  if (!existsResult.exists) {
    console.log(`${colors.red}❌ Merchant with email '${email}' not found${colors.reset}`)
    return
  }

  const merchant = existsResult.merchant!

  console.log(`${colors.red}⚠️  DANGER: You are about to permanently delete:${colors.reset}`)
  console.log(`   👤 Name: ${merchant.name}`)
  console.log(`   📧 Email: ${merchant.email}`)
  console.log(`   📅 Created: ${merchant.createdAt.toLocaleString()}`)
  console.log(`\n${colors.red}This will also delete ALL related data including:${colors.reset}`)
  console.log(`   ${colors.red}• All clients${colors.reset}`)
  console.log(`   ${colors.red}• All credits${colors.reset}`)
  console.log(`   ${colors.red}• All payments${colors.reset}`)
  console.log(`   ${colors.red}• All payment allocations${colors.reset}`)

  if (!skipConfirm) {
    const rl = createReadlineInterface()

    try {
      const confirm1 = await promptInput(
        rl,
        `\n${colors.yellow}⚠️  Type the merchant email to confirm deletion: ${colors.reset}`,
        (input) => {
          if (input !== email) {
            return 'Email does not match'
          }
          return null
        }
      )

      const confirm2 = await promptInput(
        rl,
        `\n${colors.yellow}⚠️  Type 'DELETE' to confirm permanent deletion: ${colors.reset}`,
        (input) => {
          if (input !== 'DELETE') {
            return 'Must type DELETE in capital letters'
          }
          return null
        }
      )

      if (confirm1 !== email || confirm2 !== 'DELETE') {
        console.log(`${colors.yellow}🚫 Deletion cancelled${colors.reset}`)
        return
      }

    } finally {
      rl.close()
    }
  }

  console.log(`\n${colors.red}🔄 Deleting merchant account...${colors.reset}`)

  const result = await merchantManager.deleteMerchant(email)

  if (result.success) {
    console.log(`${colors.green}✅ Merchant account deleted successfully${colors.reset}`)
    console.log(`${colors.cyan}All related data has been removed from the database.${colors.reset}`)
  } else {
    console.log(`${colors.red}❌ Failed to delete merchant:${colors.reset}`)
    result.errors?.forEach(error => {
      console.log(`   ${colors.red}• ${error}${colors.reset}`)
    })
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

  try {
    const merchantManager = getMerchantManager()

    // Test database connection
    const isConnected = await merchantManager.testConnection()
    if (!isConnected) {
      console.error(`${colors.red}❌ Cannot connect to database. Please check your configuration.${colors.reset}`)
      process.exit(1)
    }

    // Handle different operations
    if (options.list) {
      await listMerchants(options.limit, options.verbose)
    } else if (options.details) {
      await showMerchantDetails(options.details)
    } else if (options.updatePassword) {
      await updateMerchantPassword(options.updatePassword)
    } else if (options.delete) {
      await deleteMerchant(options.delete, options.confirm)
    } else {
      // Default to listing if no specific action
      console.log(`${colors.cyan}No specific action provided. Listing merchants...${colors.reset}`)
      await listMerchants(options.limit, options.verbose)
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