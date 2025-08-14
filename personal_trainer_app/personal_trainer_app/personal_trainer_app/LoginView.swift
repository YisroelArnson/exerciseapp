import SwiftUI

struct LoginView: View {
    @EnvironmentObject var auth: AuthViewModel
    @State private var email: String = ""
    @State private var password: String = ""

    var body: some View {
        VStack(spacing: 16) {
            Text("Welcome")
                .font(.largeTitle).bold()

            VStack(spacing: 12) {
                TextField("Email", text: $email)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled(true)
                    .keyboardType(.emailAddress)
                    .textFieldStyle(.roundedBorder)

                SecureField("Password", text: $password)
                    .textFieldStyle(.roundedBorder)
            }

            if let error = auth.errorMessage, !error.isEmpty {
                Text(error)
                    .foregroundColor(.red)
                    .font(.footnote)
                    .multilineTextAlignment(.center)
            }

            if auth.isLoading {
                ProgressView().padding(.top, 4)
            }

            HStack(spacing: 12) {
                Button("Sign In") {
                    Task { await auth.signIn(email: email, password: password) }
                }
                .buttonStyle(.borderedProminent)
                .disabled(email.isEmpty || password.count < 6)

                Button("Sign Up") {
                    Task { await auth.signUp(email: email, password: password) }
                }
                .buttonStyle(.bordered)
                .disabled(email.isEmpty || password.count < 6)
            }

            Spacer()
        }
        .padding()
    }
}

#Preview {
    LoginView().environmentObject(AuthViewModel())
}
