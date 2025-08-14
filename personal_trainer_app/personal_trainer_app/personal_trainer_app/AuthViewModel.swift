import Foundation
import SwiftUI
#if canImport(FirebaseAuth)
import FirebaseAuth
#endif

struct AppUser {
    let uid: String
    let email: String?
}

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var user: AppUser?
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    init() {
        #if canImport(FirebaseAuth)
        Auth.auth().addStateDidChangeListener { [weak self] _, user in
            guard let self = self else { return }
            if let user = user {
                self.user = AppUser(uid: user.uid, email: user.email)
            } else {
                self.user = nil
            }
        }
        #endif
    }

    func signUp(email: String, password: String) async {
        #if canImport(FirebaseAuth)
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            _ = try await Auth.auth().createUser(withEmail: email, password: password)
            if let u = Auth.auth().currentUser {
                self.user = AppUser(uid: u.uid, email: u.email)
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        #else
        self.errorMessage = "FirebaseAuth not available in this build. Add FirebaseAuth via SPM."
        #endif
    }

    func signIn(email: String, password: String) async {
        #if canImport(FirebaseAuth)
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            _ = try await Auth.auth().signIn(withEmail: email, password: password)
            if let u = Auth.auth().currentUser {
                self.user = AppUser(uid: u.uid, email: u.email)
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        #else
        self.errorMessage = "FirebaseAuth not available in this build. Add FirebaseAuth via SPM."
        #endif
    }

    func signOut() {
        #if canImport(FirebaseAuth)
        try? Auth.auth().signOut()
        #endif
        self.user = nil
    }
}
