# 🔐 Firebase Authentication Guide for Exercise App

This guide covers the complete authentication system implementation for your exercise app, including backend API and iOS frontend integration.

## 📋 **Table of Contents**

1. [Authentication Overview](#authentication-overview)
2. [Backend API Endpoints](#backend-api-endpoints)
3. [iOS Firebase Setup](#ios-firebase-setup)
4. [Authentication Methods](#authentication-methods)
5. [Token Management](#token-management)
6. [Testing Authentication](#testing-authentication)
7. [Production Considerations](#production-considerations)

## 🎯 **Authentication Overview**

Your app supports multiple authentication methods:
- ✅ **Email/Password** - Traditional email registration and login
- ✅ **Google Sign-In** - OAuth with Google
- ✅ **Apple Sign-In** - Sign in with Apple (required for iOS)
- ✅ **Phone Authentication** - SMS verification
- ✅ **Anonymous Auth** - Guest users (optional)

## 🛠 **Backend API Endpoints**

### **Registration & Login**
```
POST /api/auth/register/email          # Email/password registration
POST /api/auth/login/email             # Email/password login (deprecated - use client-side)
POST /api/auth/verify-login            # Verify ID token (all auth methods)
```

### **Email Management**
```
POST /api/auth/send-email-verification # Send email verification
POST /api/auth/reset-password          # Send password reset email
POST /api/auth/change-password         # Change password (authenticated)
```

### **Phone Authentication**
```
POST /api/auth/phone/send-code         # Send SMS verification code
```

### **Token Management**
```
POST /api/auth/verify-token            # Verify token validity
POST /api/auth/refresh-token           # Refresh authentication token
POST /api/auth/logout                  # Logout and revoke tokens
```

### **User Profile**
```
GET /api/auth/me                       # Get current user
POST /api/auth/profile                 # Create/update profile
PUT /api/auth/profile                  # Update profile details
PUT /api/auth/preferences              # Update user preferences
DELETE /api/auth/account               # Delete account
```

### **Social Authentication**
```
GET /api/auth/social/providers         # Get available providers
```

## 📱 **iOS Firebase Setup**

### **Step 1: Install Firebase SDK**

Add Firebase to your `Package.swift` or use CocoaPods:

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/firebase/firebase-ios-sdk", from: "10.0.0")
]
```

Or CocoaPods:
```ruby
# Podfile
pod 'Firebase/Auth'
pod 'Firebase/Firestore'
pod 'GoogleSignIn'
```

### **Step 2: Download GoogleService-Info.plist**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`exerciseapp-b4f9d`)
3. Go to Project Settings → Your Apps
4. Download `GoogleService-Info.plist`
5. Add it to your Xcode project

### **Step 3: Configure Firebase in AppDelegate**

```swift
import Firebase
import GoogleSignIn

class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, 
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // Configure Firebase
        FirebaseApp.configure()
        
        // Configure Google Sign In
        guard let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
              let plist = NSDictionary(contentsOfFile: path),
              let clientId = plist["CLIENT_ID"] as? String else {
            fatalError("GoogleService-Info.plist not found")
        }
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientId)
        
        return true
    }
    
    func application(_ app: UIApplication, open url: URL, 
                     options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return GIDSignIn.sharedInstance.handle(url)
    }
}
```

## 🔑 **Authentication Methods Implementation**

### **1. Email/Password Authentication**

#### **Registration**
```swift
import FirebaseAuth

class AuthService: ObservableObject {
    @Published var user: User?
    @Published var isAuthenticated = false
    
    func registerWithEmail(email: String, password: String, displayName: String) async throws {
        // Create user with Firebase Auth
        let result = try await Auth.auth().createUser(withEmail: email, password: password)
        
        // Update display name
        let changeRequest = result.user.createProfileChangeRequest()
        changeRequest.displayName = displayName
        try await changeRequest.commitChanges()
        
        // Get ID token
        let idToken = try await result.user.getIDToken()
        
        // Verify with your backend
        try await verifyWithBackend(idToken: idToken)
    }
    
    func loginWithEmail(email: String, password: String) async throws {
        let result = try await Auth.auth().signIn(withEmail: email, password: password)
        let idToken = try await result.user.getIDToken()
        try await verifyWithBackend(idToken: idToken)
    }
}
```

#### **Backend Verification**
```swift
func verifyWithBackend(idToken: String) async throws {
    let url = URL(string: "http://localhost:3000/api/auth/verify-login")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body = ["idToken": idToken]
    request.httpBody = try JSONSerialization.data(withJSONObject: body)
    
    let (data, response) = try await URLSession.shared.data(for: request)
    
    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 200 else {
        throw AuthError.serverError
    }
    
    let result = try JSONDecoder().decode(AuthResponse.self, from: data)
    
    DispatchQueue.main.async {
        self.user = result.user
        self.isAuthenticated = true
    }
}
```

### **2. Google Sign-In**

```swift
import GoogleSignIn
import FirebaseAuth

func signInWithGoogle() async throws {
    guard let presentingViewController = UIApplication.shared.windows.first?.rootViewController else {
        throw AuthError.noViewController
    }
    
    let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presentingViewController)
    
    guard let idToken = result.user.idToken?.tokenString else {
        throw AuthError.noIdToken
    }
    
    let accessToken = result.user.accessToken.tokenString
    
    let credential = GoogleAuthProvider.credential(withIDToken: idToken, accessToken: accessToken)
    let authResult = try await Auth.auth().signIn(with: credential)
    
    let firebaseIdToken = try await authResult.user.getIDToken()
    try await verifyWithBackend(idToken: firebaseIdToken)
}
```

### **3. Apple Sign-In**

First, enable "Sign in with Apple" capability in Xcode.

```swift
import AuthenticationServices
import FirebaseAuth

func signInWithApple() {
    let request = ASAuthorizationAppleIDProvider().createRequest()
    request.requestedScopes = [.fullName, .email]
    
    let authorizationController = ASAuthorizationController(authorizationRequests: [request])
    authorizationController.delegate = self
    authorizationController.presentationContextProvider = self
    authorizationController.performRequests()
}

extension AuthService: ASAuthorizationControllerDelegate {
    func authorizationController(controller: ASAuthorizationController, 
                                didCompleteWithAuthorization authorization: ASAuthorization) {
        
        if let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential {
            guard let nonce = currentNonce else {
                fatalError("Invalid state: A login callback was received, but no login request was sent.")
            }
            
            guard let appleIDToken = appleIDCredential.identityToken else {
                print("Unable to fetch identity token")
                return
            }
            
            guard let idTokenString = String(data: appleIDToken, encoding: .utf8) else {
                print("Unable to serialize token string from data")
                return
            }
            
            let credential = OAuthProvider.credential(withProviderID: "apple.com",
                                                      idToken: idTokenString,
                                                      rawNonce: nonce)
            
            Task {
                do {
                    let result = try await Auth.auth().signIn(with: credential)
                    let idToken = try await result.user.getIDToken()
                    try await verifyWithBackend(idToken: idToken)
                } catch {
                    print("Error authenticating: \(error.localizedDescription)")
                }
            }
        }
    }
}
```

### **4. Phone Authentication**

```swift
func signInWithPhone(phoneNumber: String) async throws {
    let verificationID = try await PhoneAuthProvider.provider().verifyPhoneNumber(phoneNumber, uiDelegate: nil)
    // Store verificationID for later use
    UserDefaults.standard.set(verificationID, forKey: "authVerificationID")
}

func verifyPhoneCode(verificationCode: String) async throws {
    guard let verificationID = UserDefaults.standard.string(forKey: "authVerificationID") else {
        throw AuthError.noVerificationID
    }
    
    let credential = PhoneAuthProvider.provider().credential(withVerificationID: verificationID,
                                                             verificationCode: verificationCode)
    
    let result = try await Auth.auth().signIn(with: credential)
    let idToken = try await result.user.getIDToken()
    try await verifyWithBackend(idToken: idToken)
}
```

## 🎫 **Token Management**

### **Automatic Token Refresh**
```swift
class TokenManager: ObservableObject {
    @Published var currentToken: String?
    private var refreshTimer: Timer?
    
    func startTokenRefresh() {
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 3000, repeats: true) { _ in
            Task {
                await self.refreshToken()
            }
        }
    }
    
    func refreshToken() async {
        guard let user = Auth.auth().currentUser else { return }
        
        do {
            let idToken = try await user.getIDToken(forcingRefresh: true)
            DispatchQueue.main.async {
                self.currentToken = idToken
            }
        } catch {
            print("Token refresh failed: \(error)")
        }
    }
}
```

### **API Request Headers**
```swift
func makeAuthenticatedRequest(to endpoint: String) async throws {
    guard let token = currentToken else {
        throw AuthError.noToken
    }
    
    var request = URLRequest(url: URL(string: endpoint)!)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let (data, response) = try await URLSession.shared.data(for: request)
    // Handle response...
}
```

## 🧪 **Testing Authentication**

### **Test Email Registration**
```bash
curl -X POST http://localhost:3000/api/auth/register/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User"
  }'
```

### **Test Token Verification**
```bash
curl -X POST http://localhost:3000/api/auth/verify-login \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "YOUR_FIREBASE_ID_TOKEN"
  }'
```

### **Test Protected Endpoint**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

## 🚀 **Production Considerations**

### **Security Checklist**
- ✅ **HTTPS Only**: Ensure all API calls use HTTPS in production
- ✅ **Token Expiry**: Implement proper token refresh logic
- ✅ **Rate Limiting**: Already implemented on backend
- ✅ **Input Validation**: All inputs are validated
- ✅ **Email Verification**: Implement email service (SendGrid, etc.)

### **Firebase Security Rules**
Update your Firestore rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /exercises/{exerciseId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### **Environment Configuration**
Update your `.env` for production:
```env
NODE_ENV=production
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
# Remove FIREBASE_SERVICE_ACCOUNT_PATH in production
```

## 📞 **Support & Troubleshooting**

### **Common Issues**
1. **"Token expired"**: Implement automatic token refresh
2. **"Email already exists"**: Handle in UI with appropriate message
3. **"Weak password"**: Enforce strong passwords in UI
4. **Social sign-in fails**: Check provider configuration

### **Debug Mode**
Enable debug logging in development:
```swift
// In AppDelegate
Auth.auth().settings?.isAppVerificationDisabledForTesting = true // Phone auth testing
```

Your authentication system is now fully configured! 🎉 