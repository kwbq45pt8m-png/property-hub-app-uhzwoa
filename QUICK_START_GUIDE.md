
# 🚀 Quick Start Guide - Property Rental App

## 📱 How to Test the App

### Step 1: Open the App
- **Web**: Open the provided URL in your browser
- **iOS**: Open Expo Go and scan the QR code
- **Android**: Open Expo Go and scan the QR code

### Step 2: Create an Account
1. You'll see the **Sign In** screen
2. Click **"Don't have an account? Sign Up"**
3. Fill in:
   ```
   Name: Your Name (optional)
   Email: your-email@example.com
   Password: your-password
   ```
4. Click **"Sign Up"**
5. ✅ You're now logged in!

### Step 3: Explore the App

#### 🏠 Home Tab
- Browse available properties
- Filter by district
- Search properties
- Click on a property to view details
- Click **"List Property"** to add your own

#### 💬 Chats Tab
- View all your conversations
- Click on a chat to open it
- Send messages to property owners

#### 👤 Profile Tab
- View your profile information
- See your listed properties
- Click **Sign Out** to logout

### Step 4: List a Property
1. Go to **Home** tab
2. Click **"List Property"** button
3. Fill in property details:
   - Title
   - Description
   - Price (monthly rent in HKD)
   - Size (square feet)
   - District
   - Equipment/Amenities
4. Add photos (optional)
5. Add virtual tour video (optional)
6. Click **"List Property"**
7. ✅ Your property is now live!

### Step 5: Contact a Property Owner
1. Browse properties on **Home** tab
2. Click on a property you're interested in
3. Click **"Contact Owner"** button
4. Watch a short ad (5 seconds)
5. ✅ Chat opens - start messaging!

---

## 🎯 Test Scenarios

### Scenario 1: New User Journey
1. Sign up with a new email
2. Browse properties
3. View property details
4. Contact a property owner
5. Send a message

### Scenario 2: Property Owner Journey
1. Sign in
2. List a new property
3. Upload photos
4. View your listings in Profile tab
5. Respond to inquiries in Chats tab

### Scenario 3: Session Persistence
1. Sign in
2. Close the app/browser
3. Reopen the app
4. ✅ You should still be logged in

### Scenario 4: Multi-language
1. Click the language selector (top right)
2. Switch between English, 繁體中文, 简体中文
3. ✅ UI updates immediately

---

## 🔐 Sample Test Accounts

You can create your own accounts, or use these examples:

```
Account 1 (Property Owner):
Email: owner@example.com
Password: password123

Account 2 (Renter):
Email: renter@example.com
Password: password123
```

**Note**: You'll need to create these accounts first using the sign-up flow.

---

## ✅ What to Test

### Authentication
- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Sign out
- [ ] Session persists after refresh
- [ ] Can't access app without signing in

### Properties
- [ ] View property list
- [ ] Filter by district
- [ ] Search properties
- [ ] View property details
- [ ] List a new property
- [ ] Upload property photos
- [ ] Upload virtual tour video
- [ ] View own listings in profile

### Chats
- [ ] Start a chat with property owner
- [ ] Send messages
- [ ] Receive messages
- [ ] View chat history
- [ ] Multiple chats work correctly

### UI/UX
- [ ] Language switching works
- [ ] Ads display correctly
- [ ] Loading states show
- [ ] Error messages are clear
- [ ] Navigation is smooth
- [ ] Works on mobile and web

---

## 🐛 Known Issues

1. **OAuth Sign-In**: Google/Apple sign-in requires OAuth credentials to be configured. You may see a message indicating this during development.

2. **iOS Session Error**: You may see a 500 error in iOS logs when checking session. This doesn't affect functionality.

---

## 📞 Need Help?

If something isn't working:

1. Check the console logs (F12 in browser)
2. Try signing out and back in
3. Clear browser cache/app data
4. Create a new test account

---

**Happy Testing! 🎉**
