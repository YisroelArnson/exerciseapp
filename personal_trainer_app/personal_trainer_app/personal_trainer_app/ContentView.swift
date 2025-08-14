//
//  ContentView.swift
//  personal_trainer_app
//
//  Created by ISWA on 8/7/25.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var auth: AuthViewModel

    var body: some View {
        Group {
            if let user = auth.user {
                VStack(spacing: 16) {
                    Text("You're signed in")
                        .font(.title2).bold()
                    Text(user.email ?? "No email")
                        .foregroundStyle(.secondary)
                    Button("Sign Out") { auth.signOut() }
                        .buttonStyle(.bordered)
                }
                .padding()
            } else {
                LoginView()
            }
        }
    }
}

#Preview {
    ContentView().environmentObject(AuthViewModel())
}
