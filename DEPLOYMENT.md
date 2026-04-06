# Deployment Guide

This guide explains how to deploy Kreancia to production platforms like Vercel.

## 🚀 Quick Deployment to Vercel

### 1. Database Setup
First, set up your production database:
- Create a [Neon Database](https://neon.tech) (recommended for Vercel)
- Copy the connection string

### 2. Environment Variables
In your Vercel project settings, add these environment variables:

```bash
# Database
DATABASE_URL="postgresql://your-neon-connection-string"

# NextAuth.js
NEXTAUTH_URL="https://your-app-name.vercel.app"
NEXTAUTH_SECRET="your-32-character-secret-key"

# Admin Setup (for first deployment only)
ADMIN_SETUP_MODE="true"
ADMIN_SETUP_TOKEN="your-secure-setup-token"
```

### 3. Generate Secure Values

**NEXTAUTH_SECRET** (32+ characters):
```bash
# Generate a secure secret
openssl rand -base64 32
```

**ADMIN_SETUP_TOKEN** (secure random string):
```bash
# Generate a secure setup token
openssl rand -base64 24
```

### 4. Deploy to Vercel
```bash
git add .
git commit -m "feat: add admin setup for production deployment"
git push
```

### 5. Create First Merchant Account

Once deployed, visit your admin setup page:
```
https://your-app-name.vercel.app/admin/setup
```

1. Enter your **ADMIN_SETUP_TOKEN**
2. Fill in your business details
3. Create your merchant account
4. **Important**: The setup page will automatically disable itself

### 6. Disable Setup Mode (Security)

After creating your merchant account, **immediately disable setup mode**:

1. Go to Vercel project settings
2. Change `ADMIN_SETUP_MODE` to `"false"`
3. Redeploy or wait for the next deployment

## 🔒 Security Notes

### Admin Setup Security
- **Setup token**: Keep your `ADMIN_SETUP_TOKEN` secret and secure
- **One-time use**: Setup page automatically disables after first merchant
- **Environment controlled**: Only works when `ADMIN_SETUP_MODE="true"`
- **No auth bypass**: Requires valid token for access

### Production Checklist
- [ ] Strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Secure `ADMIN_SETUP_TOKEN` 
- [ ] Valid production `DATABASE_URL`
- [ ] Correct `NEXTAUTH_URL` with your domain
- [ ] Setup mode disabled after use (`ADMIN_SETUP_MODE="false"`)

## 🐛 Troubleshooting

### Setup Page Not Available
- Check `ADMIN_SETUP_MODE` is `"true"`
- Verify no merchants exist in database
- Ensure `ADMIN_SETUP_TOKEN` is set

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is accessible from Vercel
- Ensure database allows SSL connections

### Token Verification Failed
- Double-check `ADMIN_SETUP_TOKEN` matches exactly
- No extra spaces or characters
- Case sensitive

## 📈 Post-Deployment

### Next Steps
1. Log in with your new merchant account
2. Create your first client
3. Test the credit management system
4. Consider setting up monitoring

### Admin Panel (Future)
This quick setup will be replaced with a full admin panel in Phase 2, providing:
- Multiple merchant management
- User administration
- System monitoring
- Audit logs

## 🆘 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connection
4. Review network/firewall settings

For additional help, refer to the main README.md file.