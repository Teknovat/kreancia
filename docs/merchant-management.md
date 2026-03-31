# Merchant Account Management System

This document describes the merchant account management system for the Kreancia multi-tenant credit management application.

## Overview

The merchant management system provides CLI tools for creating and managing merchant accounts. Since this is a B2B application, merchant accounts are created manually by administrators rather than through public registration.

## Features

- ✅ **CLI Scripts**: Command-line tools for account creation and management
- ✅ **bcrypt Password Hashing**: Secure password storage using bcrypt with salt rounds
- ✅ **Email Uniqueness**: Automatic validation to prevent duplicate accounts
- ✅ **Currency Selection**: Support for multiple currencies (TND, EUR, USD, etc.)
- ✅ **Interactive Mode**: User-friendly prompts for account creation
- ✅ **Batch Mode**: Non-interactive mode for automation
- ✅ **Input Validation**: Comprehensive validation for all fields
- ✅ **RLS Integration**: Works with Row Level Security for data isolation

## CLI Commands

### Create Merchant Account

```bash
# Interactive mode (recommended for manual creation)
npm run create-merchant

# Non-interactive mode (for automation)
npm run create-merchant -- --email=merchant@example.com --name="John Doe" --currency=EUR

# With business information
npm run create-merchant -- \
  --email=jane@boutique.tn \
  --name="Jane Smith" \
  --business-name="Jane's Boutique" \
  --business-address="123 Main St, Tunis" \
  --phone="+216 71 123 456" \
  --currency=TND
```

### Manage Existing Merchants

```bash
# List all merchants
npm run manage-merchants -- --list

# Show detailed information
npm run manage-merchants -- --details merchant@example.com

# Update merchant password
npm run manage-merchants -- --update-password merchant@example.com

# Delete merchant (dangerous!)
npm run manage-merchants -- --delete old@merchant.com
```

### Alternative Commands

```bash
# Shorter aliases
npm run merchants:create
npm run merchants:list
npm run merchants:manage
```

## Supported Currencies

- **TND** - Tunisian Dinar (default)
- **EUR** - Euro
- **USD** - US Dollar
- **MAD** - Moroccan Dirham
- **DZD** - Algerian Dirham
- **LYD** - Libyan Dinar

## Password Requirements

Passwords must meet the following criteria:

- ✅ At least 8 characters long
- ✅ Contains uppercase letters (A-Z)
- ✅ Contains lowercase letters (a-z)
- ✅ Contains numbers (0-9)
- ✅ Contains special characters (!@#$%^&*)

The CLI provides real-time feedback on password strength.

## Validation Rules

### Email
- Must be a valid email format
- Must be unique across all merchants
- 5-255 characters
- Automatically converted to lowercase

### Name (Merchant Contact Name)
- 2-50 characters
- Only letters, spaces, hyphens, and apostrophes
- Used for personal/contact identification

### Business Name (Optional)
- 2-100 characters
- Letters, numbers, spaces, and common business symbols
- Used for business identification

### Phone (Optional)
- International format required (+country code)
- Example: +216 71 123 456

### Business Address (Optional)
- Up to 255 characters
- Free text field for business address

## Security Features

### Password Hashing
- Uses bcrypt with 10 salt rounds (same as NextAuth.js)
- Passwords are never stored in plain text
- Compatible with existing authentication system

### Email Uniqueness
- Enforced at both application and database levels
- Case-insensitive checking
- Prevents duplicate accounts

### Row Level Security (RLS)
- All operations respect the multi-tenant architecture
- Automatic tenant isolation
- Secure database operations

## Database Schema

The merchant model includes:

```typescript
interface Merchant {
  id: string              // CUID primary key
  email: string           // Unique email address
  password: string        // bcrypt hashed password
  name: string           // Contact/personal name
  currency: string       // Default currency (TND, EUR, USD, etc.)
  businessName?: string  // Optional business name
  businessAddress?: string // Optional business address
  phone?: string         // Optional phone number
  createdAt: Date        // Creation timestamp
  updatedAt: Date        // Last update timestamp
}
```

## Error Handling

The CLI scripts provide comprehensive error handling:

- **Validation Errors**: Clear messages for invalid input
- **Duplicate Emails**: Prevents creation of duplicate accounts
- **Database Errors**: Graceful handling of connection issues
- **Password Strength**: Real-time feedback on password requirements
- **Confirmation Prompts**: Safety checks for destructive operations

## Usage Examples

### Creating a New Merchant

#### Interactive Mode (Recommended)
```bash
npm run create-merchant
```

The script will prompt for:
1. Email address
2. Merchant name
3. Password (with strength validation)
4. Currency selection
5. Optional business information

#### Non-Interactive Mode
```bash
npm run create-merchant -- \
  --email=newmerchant@company.com \
  --name="Ahmed Ben Ali" \
  --password="SecurePassword123!" \
  --currency=TND \
  --business-name="Ben Ali Trading" \
  --phone="+216 71 555 123"
```

### Managing Existing Merchants

#### List All Merchants
```bash
# Default list (10 merchants)
npm run manage-merchants -- --list

# List more merchants
npm run manage-merchants -- --list --limit 50

# Verbose output with IDs
npm run manage-merchants -- --list --verbose
```

#### View Merchant Details
```bash
npm run manage-merchants -- --details merchant@example.com
```

#### Update Password
```bash
npm run manage-merchants -- --update-password merchant@example.com
```

#### Delete Merchant (Dangerous)
```bash
# With safety confirmations
npm run manage-merchants -- --delete old@merchant.com

# Skip confirmations (automation only)
npm run manage-merchants -- --delete old@merchant.com --confirm
```

## Integration with Authentication

The merchant accounts created by these scripts are immediately compatible with the NextAuth.js authentication system:

1. **Login**: Merchants can log in at `/login`
2. **Password Verification**: Uses the same bcrypt comparison
3. **Session Management**: Full integration with NextAuth.js sessions
4. **Multi-Tenant**: Automatic tenant isolation via RLS

## Best Practices

### Account Creation
1. **Use Interactive Mode**: For manual account creation
2. **Verify Information**: Double-check all details before creation
3. **Strong Passwords**: Ensure merchants use secure passwords
4. **Business Information**: Collect complete business details when possible

### Account Management
1. **Regular Audits**: Periodically review merchant accounts
2. **Password Updates**: Encourage regular password changes
3. **Backup Before Deletion**: Always backup before deleting accounts
4. **Monitor Usage**: Track account activity and usage

### Security
1. **Limit CLI Access**: Only authorized administrators should have CLI access
2. **Audit Trail**: Log all merchant management operations
3. **Secure Environment**: Run scripts in secure environments only
4. **Regular Updates**: Keep dependencies updated for security

## Development Notes

### File Structure
```
scripts/
├── lib/
│   ├── validation.ts        # Input validation utilities
│   └── merchant-manager.ts  # Core merchant management logic
├── create-merchant.ts       # Account creation CLI
└── manage-merchants.ts      # Account management CLI
```

### Adding New Currencies
To add support for new currencies:

1. Update `SUPPORTED_CURRENCIES` in `scripts/lib/validation.ts`
2. Ensure the currency code follows ISO 4217 standards
3. Test currency validation and display

### Extending Validation
To add new validation rules:

1. Update schemas in `scripts/lib/validation.ts`
2. Add corresponding field validators
3. Update CLI prompts if needed
4. Test thoroughly with edge cases

## Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npm run db:studio

# Check environment variables
cat .env | grep DATABASE_URL
```

### Permission Issues
```bash
# Ensure tsx is installed
npm install tsx

# Check script permissions
ls -la scripts/
```

### Validation Errors
- Check input format against validation rules
- Use verbose mode for detailed error messages
- Verify currency codes are supported

## Future Enhancements

Planned improvements for the merchant management system:

1. **Bulk Import**: CSV/Excel import for multiple merchants
2. **Account Templates**: Pre-configured account types
3. **Activity Logging**: Comprehensive audit trail
4. **Email Notifications**: Welcome emails and notifications
5. **Account Suspension**: Temporary account deactivation
6. **API Endpoints**: REST API for programmatic access
7. **Dashboard Integration**: Web-based account management interface

## Support

For issues with the merchant management system:

1. Check this documentation for common solutions
2. Review the error messages for specific guidance
3. Use `--verbose` mode for detailed debugging information
4. Ensure database connectivity and proper environment setup