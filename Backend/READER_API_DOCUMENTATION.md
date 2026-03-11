# Reader Authentication API Documentation

Base URL: `http://localhost:5001/api/readers`

## Table of Contents
1. [Register](#1-register)
2. [Login](#2-login)
3. [Get Profile](#3-get-profile)
4. [Update Profile](#4-update-profile)
5. [Change Password](#5-change-password)
6. [Forgot Password](#6-forgot-password)
7. [Reset Password](#7-reset-password)
8. [Verify Email](#8-verify-email)
9. [Resend OTP](#9-resend-otp)

---

## 1. Register

Create a new reader account.

**Endpoint:** `POST /api/readers/register`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully! Welcome to Pustakyatra.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "reader_id": 1,
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400` - Missing fields or invalid email
- `400` - Email already exists
- `500` - Server error

---

## 2. Login

Login to an existing account.

**Endpoint:** `POST /api/readers/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful! Welcome back.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "reader_id": 1,
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400` - Missing email or password
- `404` - Account not found
- `401` - Incorrect password
- `500` - Server error

---

## 3. Get Profile

Get the authenticated user's profile.

**Endpoint:** `GET /api/readers/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "reader_id": 1,
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+977-9812345678",
    "address": "Kathmandu, Nepal",
    "emailVerified": 0,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized (no token or invalid token)
- `404` - User not found
- `500` - Server error

---

## 4. Update Profile

Update the authenticated user's profile information.

**Endpoint:** `PUT /api/readers/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fullName": "John Updated",
  "email": "johnupdated@example.com",
  "phone": "+977-9812345678",
  "address": "Kathmandu, Nepal"
}
```

**Note:** 
- `fullName` and `email` are required
- `phone` and `address` are optional
- If `phone` or `address` are empty strings or not provided, they will be set to NULL

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "reader_id": 1,
    "fullName": "John Updated",
    "email": "johnupdated@example.com",
    "phone": "+977-9812345678",
    "address": "Kathmandu, Nepal"
  }
}
```

**Error Responses:**
- `400` - Missing required fields (fullName or email)
- `400` - Invalid email format
- `400` - Invalid phone number format
- `400` - Email already in use by another account
- `401` - Unauthorized
- `500` - Server error

---

## 5. Change Password

Change the authenticated user's password.

**Endpoint:** `PUT /api/readers/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Missing fields or password too short
- `401` - Current password is incorrect
- `401` - Unauthorized
- `404` - User not found
- `500` - Server error

---

## 6. Forgot Password

Request a password reset OTP.

**Endpoint:** `POST /api/readers/forgot-password`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email. Please check your inbox."
}
```

**Error Responses:**
- `400` - Missing email
- `404` - No account found with this email
- `500` - Server error or failed to send email

**Note:** OTP expires in 10 minutes.

---

## 7. Reset Password

Reset password using OTP.

**Endpoint:** `POST /api/readers/reset-password`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now login with your new password."
}
```

**Error Responses:**
- `400` - Missing fields or password too short
- `400` - Invalid or expired OTP
- `500` - Server error

---

## 8. Verify Email

Verify email address using OTP.

**Endpoint:** `POST /api/readers/verify-email`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully!"
}
```

**Error Responses:**
- `400` - Missing email or OTP
- `400` - Invalid or expired OTP
- `500` - Server error

---

## 9. Resend OTP

Resend OTP for email verification or password reset.

**Endpoint:** `POST /api/readers/resend-otp`

**Request Body:**
```json
{
  "email": "john@example.com",
  "type": "email_verification"
}
```

**OTP Types:**
- `email_verification` - For email verification
- `password_reset` - For password reset

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email. Please check your inbox."
}
```

**Error Responses:**
- `400` - Missing email or type
- `400` - Invalid OTP type
- `404` - No account found with this email
- `500` - Server error or failed to send email

---

## Authentication

Protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

The token is returned when you register or login. Store it securely (e.g., in localStorage) and include it in all protected route requests.

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

---

## Database Schema Requirements

The `readers` table should have these columns for the authentication features to work:

```sql
CREATE TABLE readers (
  reader_id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email_verified TINYINT(1) DEFAULT 0,
  email_otp VARCHAR(6),
  email_otp_expiry DATETIME,
  reset_otp VARCHAR(6),
  reset_otp_expiry DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Testing with Postman/Thunder Client

### Example: Register and Login Flow

1. **Register:**
   - POST `http://localhost:5001/api/readers/register`
   - Body: `{ "fullName": "Test User", "email": "test@example.com", "password": "test123" }`
   - Save the returned token

2. **Get Profile:**
   - GET `http://localhost:5001/api/readers/profile`
   - Header: `Authorization: Bearer <token_from_step_1>`

3. **Update Profile:**
   - PUT `http://localhost:5001/api/readers/profile`
   - Header: `Authorization: Bearer <token_from_step_1>`
   - Body: `{ "fullName": "Updated Name", "email": "test@example.com" }`

### Example: Password Reset Flow

1. **Forgot Password:**
   - POST `http://localhost:5001/api/readers/forgot-password`
   - Body: `{ "email": "test@example.com" }`
   - Check email for OTP

2. **Reset Password:**
   - POST `http://localhost:5001/api/readers/reset-password`
   - Body: `{ "email": "test@example.com", "otp": "123456", "newPassword": "newpass123" }`

3. **Login with New Password:**
   - POST `http://localhost:5001/api/readers/login`
   - Body: `{ "email": "test@example.com", "password": "newpass123" }`

---

## Notes

- All OTPs expire after 10 minutes
- Passwords must be at least 6 characters long
- Email addresses must be valid and unique
- Tokens expire after 7 days
- Welcome emails are sent automatically on registration
- OTP emails are sent for password reset and email verification
