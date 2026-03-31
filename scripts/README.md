# Kreancia CLI Scripts

This directory contains command-line interface (CLI) scripts for managing the Kreancia multi-tenant credit management system.

## Available Scripts

### 🏪 Merchant Management

#### Create Merchant Accounts
```bash
# Interactive mode (recommended)
npm run create-merchant

# Non-interactive mode
npm run create-merchant -- --email=merchant@example.com --name="John Doe" --password="SecurePass123!" --currency=EUR
```

#### Manage Existing Merchants
```bash
# List all merchants
npm run merchants:list

# Show merchant details
npm run manage-merchants -- --details merchant@example.com

# Update merchant password
npm run manage-merchants -- --update-password merchant@example.com
```

#### Test Authentication
```bash
# Verify merchant can authenticate
npm run test-auth merchant@example.com "password"
```

## Quick Reference

| Command | Description | Example |
|---------|-------------|---------|
| `npm run create-merchant` | Create new merchant (interactive) | Interactive prompts |
| `npm run merchants:create` | Alias for create-merchant | Same as above |
| `npm run merchants:list` | List all merchants | Shows merchant summary |
| `npm run merchants:manage` | Merchant management menu | Various operations |
| `npm run test-auth` | Test merchant authentication | Verify login works |

## Common Use Cases

### 1. Create New Merchant Account
```bash
# Step 1: Create the account
npm run create-merchant

# Step 2: Verify authentication works
npm run test-auth newmerchant@company.com "theirpassword"

# Step 3: Confirm in list
npm run merchants:list
```

### 2. Password Reset for Existing Merchant
```bash
# Update the password
npm run manage-merchants -- --update-password merchant@example.com

# Test the new password
npm run test-auth merchant@example.com "newpassword"
```

### 3. Bulk Account Creation
```bash
# Create multiple accounts using non-interactive mode
npm run create-merchant -- --email=merchant1@company.com --name="Merchant One" --password="Pass123!" --currency=TND --business-name="Company One"
npm run create-merchant -- --email=merchant2@company.com --name="Merchant Two" --password="Pass456!" --currency=EUR --business-name="Company Two"

# Verify all accounts
npm run merchants:list --limit=20
```

### 4. Account Audit
```bash
# List all merchants with full details
npm run merchants:list --verbose

# Check specific merchant details
npm run manage-merchants -- --details merchant@example.com
```

## Script Details

### `create-merchant.ts`
- **Purpose**: Create new merchant accounts
- **Features**: Interactive/batch mode, validation, duplicate checking
- **Security**: bcrypt password hashing, email uniqueness
- **Currencies**: TND, EUR, USD, MAD, DZD, LYD

### `manage-merchants.ts`
- **Purpose**: Manage existing merchant accounts
- **Features**: List, details, password updates, account deletion
- **Safety**: Confirmation prompts for destructive operations
- **Audit**: Detailed account information and history

### `test-auth.ts`
- **Purpose**: Verify merchant authentication
- **Features**: Password verification, NextAuth.js compatibility
- **Output**: Shows what NextAuth would return for the user

### `lib/validation.ts`
- **Purpose**: Input validation and sanitization
- **Features**: Email, password, currency, phone validation
- **Security**: Password strength checking, input sanitization

### `lib/merchant-manager.ts`
- **Purpose**: Core merchant management logic
- **Features**: Database operations, error handling, RLS integration
- **Security**: Secure database client, transaction support

## Security Features

### Password Security
- ✅ bcrypt hashing with 10 salt rounds
- ✅ Strong password requirements (8+ chars, mixed case, numbers, symbols)
- ✅ Real-time password strength feedback
- ✅ Compatible with NextAuth.js authentication

### Data Protection
- ✅ Email uniqueness enforcement
- ✅ Input validation and sanitization
- ✅ Row Level Security (RLS) integration
- ✅ Safe error handling without data leaks

### Operation Safety
- ✅ Confirmation prompts for destructive operations
- ✅ Database transaction support
- ✅ Graceful error handling
- ✅ Connection validation before operations

## Development

### Adding New Features
1. **New Validation Rules**: Update `lib/validation.ts`
2. **New Operations**: Extend `lib/merchant-manager.ts`
3. **New CLI Options**: Update respective script files
4. **New Scripts**: Follow existing patterns, add to package.json

### Testing
```bash
# Test database connection
npm run manage-merchants -- --list

# Test account creation
npm run create-merchant -- --email=test@test.com --name="Test User" --password="Test123!" --currency=TND --non-interactive

# Test authentication
npm run test-auth test@test.com "Test123!"

# Cleanup
npm run manage-merchants -- --delete test@test.com
```

### Debugging
- Use `--verbose` flag for detailed output
- Check database connectivity with `npm run db:studio`
- Verify environment variables in `.env`
- Review logs for validation errors

## Error Handling

### Common Errors
- **Database Connection**: Check DATABASE_URL in .env
- **Duplicate Email**: Email already exists in database
- **Validation Errors**: Input doesn't meet requirements
- **Permission Issues**: Check file permissions on scripts

### Error Messages
All scripts provide clear, actionable error messages:
- ❌ Failed operations show specific reasons
- ⚠️ Warnings for potentially destructive operations
- 💡 Helpful suggestions for resolving issues
- 🔍 Verbose mode for detailed debugging

## Best Practices

### Account Creation
1. **Use Interactive Mode**: More user-friendly for manual creation
2. **Verify Information**: Double-check all merchant details
3. **Test Authentication**: Always verify new accounts work
4. **Document Business Info**: Collect complete business details

### Account Management
1. **Regular Audits**: Review merchant accounts periodically
2. **Password Security**: Encourage strong, regularly updated passwords
3. **Backup First**: Always backup before destructive operations
4. **Monitor Usage**: Track account activity and usage patterns

### Security
1. **Limit Access**: Only authorized admins should run CLI scripts
2. **Secure Environment**: Run scripts in secure, logged environments
3. **Audit Trail**: Log all merchant management operations
4. **Regular Updates**: Keep dependencies updated for security

## Support

For issues with CLI scripts:
1. Check error messages for specific guidance
2. Use `--verbose` mode for debugging information
3. Verify database connectivity and environment setup
4. Review the main documentation in `/docs/merchant-management.md`
5. Test with the working demo account: `demo@merchant.com` / `merchant123`