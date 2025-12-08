# 🚀 Quick Setup Guide - Create Admin Account

This guide will help you create an admin account and start using the POS system.

## Step 1: Create User in Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Authentication** in the left menu
4. Click **Users** tab
5. Click **Add user** button
6. Enter email: `admin@shop.com` (or any email you want)
7. Enter password: `admin123` (or any secure password)
8. Click **Add user**
9. **IMPORTANT**: Copy the **User UID** (it looks like: `a1b2c3d4e5f6g7h8i9j0`)

## Step 2: Assign Admin Role in Firestore

1. In Firebase Console, click **Firestore Database** in the left menu
2. Click **Start collection** (if this is your first collection)
3. Collection ID: `users`
4. Click **Next**
5. **Document ID**: Paste the **User UID** you copied in Step 1
6. Add field:
   - Field name: `role`
   - Type: `string`
   - Value: `admin`
7. Add another field (optional but recommended):
   - Field name: `email`
   - Type: `string`
   - Value: `admin@shop.com` (same as the email you used)
8. Click **Save**

## Step 3: Login as Admin

1. Go to your POS application login page
2. Enter email: `admin@shop.com` (the one you created)
3. Enter password: `admin123` (the one you created)
4. Click **LOGIN**
5. You should see **ADMIN** badge in the top navigation
6. You now have access to:
   - ✅ Products management (add, edit, delete, update stock)
   - ✅ Sales processing
   - ✅ All reports (any date range)
   - ✅ PDF and Excel exports

## Create Additional Cashier Account (Optional)

Follow the same steps but use:
- Email: `cashier@shop.com`
- Password: `cashier123`
- In Firestore users collection, set `role: "cashier"`

Cashiers will have limited access:
- ✅ Sales processing only
- ✅ Today's report only
- ❌ Cannot access product management
- ❌ Cannot view historical reports

## Visual Guide

### Step 1 & 2: Firebase Console
```
Firebase Console
└── Authentication → Users → Add user
    ├── Email: admin@shop.com
    ├── Password: admin123
    └── Copy UID: a1b2c3d4e5f6g7h8i9j0

└── Firestore Database → users (collection)
    └── a1b2c3d4e5f6g7h8i9j0 (document)
        ├── role: "admin"
        └── email: "admin@shop.com"
```

### What You'll See After Login

**Admin sees:**
```
Header Navigation:
[ADMIN] [?] [Products] [Reports] [Logout]
         ↑      ↑          ↑
    Help  Product Mgmt  All Reports
```

**Cashier sees:**
```
Header Navigation:
[CASHIER] [?] [Reports] [Logout]
           ↑       ↑
       Help  Today Only
```

## Troubleshooting

### "User not found" error
- Make sure you created the user in Firebase Authentication first
- Check that email is correct

### "Login successful but no admin access"
- Make sure you created the document in Firestore `users` collection
- Document ID must be the User UID from Authentication
- Field `role` must be exactly `"admin"` (lowercase)
- Try logging out and logging in again

### Products link not showing
- This is normal for cashiers - only admins see the Products link
- Check your role in Firestore: it should be `"admin"` not `"cashier"`

### Still can't login as admin?
1. Go to Firebase Console → Authentication → Users
2. Find your user and copy the UID
3. Go to Firestore Database → users collection
4. Look for a document with ID matching your UID
5. If it doesn't exist, create it with `role: "admin"`
6. If it exists, check that `role` field is exactly `"admin"`

## Next Steps

Once logged in as admin:

1. **Add Products**
   - Click "Products" in navigation
   - Fill in product name, barcode (optional), price, and stock
   - Click "ADD PRODUCT"

2. **Create Settings** (optional)
   - Go to Firebase Console → Firestore
   - Create collection `settings`
   - Create document with ID `config`
   - Add fields:
     - `shopName`: "Your Shop Name"
     - `address`: "Your Shop Address"
     - `currency`: "₹" (or "$", "€", etc.)
     - `taxRate`: 0

3. **Make Your First Sale**
   - Click product to add to cart
   - Enter cash tendered
   - Click "COMPLETE SALE"

4. **View Reports**
   - Click "Reports" in navigation
   - Select date range
   - Export PDF or Excel

## Security Notes

🔒 **Change default passwords immediately in production!**

- Use strong, unique passwords
- Don't share admin credentials
- Create separate cashier accounts for staff
- Regular backup your Firestore data

## Need More Help?

- 📚 Full documentation: See `README.md`
- 🔐 Security guidelines: See `SECURITY.md`
- 🚀 Deployment: See `DEPLOYMENT.md`
- 📋 What was fixed: See `FIXES_SUMMARY.md`

---

**Quick Reference Commands:**

```
Admin Login:
Email: admin@shop.com
Password: admin123
Role in Firestore: "admin"

Cashier Login:
Email: cashier@shop.com
Password: cashier123
Role in Firestore: "cashier"
```

Remember: The UID from Authentication must match the Document ID in Firestore users collection!
