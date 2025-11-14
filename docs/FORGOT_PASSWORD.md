# Forgot Password Feature

This document describes the forgot password feature that has been added to the authentication system.

## Overview

The forgot password feature allows users to reset their password by receiving a secure token via email. The process involves two main steps:

1. **Request Password Reset**: User provides their email and receives a reset link
2. **Reset Password**: User clicks the link and provides a new password

## API Endpoints

### 1. Request Password Reset

**Endpoint**: `POST /api/auth/forgot-password`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "ok": true
}
```

**Notes**:
- Returns success even if the email doesn't exist (security measure to prevent email enumeration)
- Sends an email with a reset link valid for 1 hour
- The reset link format: `{FRONTEND_URL}/reset-password?token={token}`

### 2. Reset Password

**Endpoint**: `POST /api/auth/reset-password`

**Request Body**:
```json
{
  "token": "abc123...",
  "password": "newPassword123"
}
```

**Response** (200 OK):
```json
{
  "ok": true
}
```

**Error Responses**:
- `401`: Invalid or expired reset token
- `400`: Validation error (password too short, etc.)

## Database Schema

A new `PasswordResetToken` model was added:

```prisma
model PasswordResetToken {
  id        String   @id @default(uuid())
  email     String
  token     String   @unique
  isUsed    Boolean  @default(false)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([email])
  @@map("password_reset_tokens")
}
```

## Email Configuration

The feature uses the existing email configuration in `src/utils/email.js`. Make sure the following environment variables are set:

- `MAIL_HOST`: SMTP host (default: smtp.zeptomail.com)
- `MAIL_PORT`: SMTP port (default: 465)
- `MAIL_USERNAME`: SMTP username
- `MAIL_PASSWORD`: SMTP password
- `MAIL_FROM_NAME`: Sender name (default: Truetab)
- `MAIL_FROM_ADDRESS`: Sender email (default: info@truetab.co)
- `FRONTEND_URL`: Your frontend URL for the reset link (default: http://localhost:3000)

## Security Features

1. **Secure Token Generation**: Uses crypto.randomBytes(32) for cryptographically secure random tokens
2. **Time-based Expiration**: Tokens expire after 1 hour
3. **Single Use**: Tokens can only be used once (marked as used after successful reset)
4. **Email Privacy**: API doesn't reveal if an email exists in the system
5. **Password Hashing**: New passwords are hashed with bcrypt before storage
6. **Transaction Safety**: Password update and token invalidation happen in a database transaction

## Implementation Files

- `prisma/schema.prisma`: Added PasswordResetToken model
- `src/modules/auth/auth.validation.js`: Added validation schemas
- `src/modules/auth/auth.service.js`: Added forgotPassword and resetPassword functions
- `src/modules/auth/auth.controller.js`: Added controller functions
- `src/modules/auth/auth.routes.js`: Added routes

## Testing

To test the feature:

1. **Apply the database migration**:
   ```bash
   npx prisma migrate dev
   ```

2. **Start the server**:
   ```bash
   npm run dev
   ```

3. **Request password reset**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com"}'
   ```

4. **Check email** for the reset link and extract the token

5. **Reset password**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"token":"YOUR_TOKEN_HERE","password":"newPassword123"}'
   ```

6. **Login with new password**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"newPassword123"}'
   ```

## Email Template

The password reset email includes:
- Clear subject line: "Reset Your Password"
- Styled HTML email with a prominent button
- Plain text fallback
- Token expiration notice (1 hour)
- Security notice about ignoring unsolicited emails

## Frontend Integration

Your frontend should:

1. **Forgot Password Page**: 
   - Form with email input
   - Submit to `/api/auth/forgot-password`
   - Show success message (don't reveal if email exists)

2. **Reset Password Page**:
   - Extract token from URL query parameter
   - Form with new password input (and confirmation)
   - Submit to `/api/auth/reset-password` with token and new password
   - Redirect to login page on success

Example URL structure:
```
https://yourapp.com/reset-password?token=abc123...
```

## Troubleshooting

### Email not sending
- Check SMTP credentials in environment variables
- Verify SMTP server allows connections
- Check server logs for email sending errors

### Token expired
- Tokens expire after 1 hour
- User needs to request a new reset link

### Token already used
- Each token can only be used once
- User needs to request a new reset link if they need to reset again

## Future Enhancements

Potential improvements:
- Rate limiting for forgot password requests
- Cleanup job for expired tokens
- Multiple email template support
- SMS-based reset option
- Security notification emails
