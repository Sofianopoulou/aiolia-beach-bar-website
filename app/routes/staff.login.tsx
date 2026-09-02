import { FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { supabaseClient } from "../services/supabase.client";

type StaffRole = "BAR" | "KITCHEN" | "WAITER" | "ADMIN";

type StaffProfile = {
  id: string;
  name: string;
  role: StaffRole;
  active: boolean;
};

export default function StaffLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      const { data: authData, error: authError } =
        await supabaseClient.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Could not sign in.");
      }

      const { data: profile, error: profileError } = await supabaseClient
        .from("staff_profiles")
        .select("id, name, role, active")
        .eq("id", authData.user.id)
        .single<StaffProfile>();

      if (profileError) {
        await supabaseClient.auth.signOut();
        throw new Error("Staff profile could not be found.");
      }

      if (!profile.active) {
        await supabaseClient.auth.signOut();
        throw new Error("This staff account is inactive.");
      }

      if (profile.role === "BAR") {
        navigate("/staff/bar");
        return;
      }

      if (profile.role === "KITCHEN") {
        navigate("/staff/kitchen");
        return;
      }

      if (profile.role === "WAITER") {
        navigate("/waiter");
        return;
      }

      if (profile.role === "ADMIN") {
        navigate("/admin");
        return;
      }

      await supabaseClient.auth.signOut();
      throw new Error("Invalid staff role.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 18,
          padding: 32,
          boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            marginBottom: 28,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 1.5,
              color: "#6b7280",
            }}
          >
            AIOLIA
          </div>

          <h1
            style={{
              margin: "4px 0 6px",
              fontSize: 30,
            }}
          >
            Staff Login
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
            }}
          >
            Sign in to access your production screen.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                marginBottom: 7,
                fontWeight: 700,
              }}
            >
              Email
            </div>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              disabled={isSubmitting}
              style={{
                width: "100%",
                minHeight: 48,
                padding: "0 12px",
                borderRadius: 9,
                border: "1px solid #d1d5db",
                fontSize: 16,
                boxSizing: "border-box",
              }}
            />
          </label>

          <label
            style={{
              display: "block",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                marginBottom: 7,
                fontWeight: 700,
              }}
            >
              Password
            </div>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              disabled={isSubmitting}
              style={{
                width: "100%",
                minHeight: 48,
                padding: "0 12px",
                borderRadius: 9,
                border: "1px solid #d1d5db",
                fontSize: 16,
                boxSizing: "border-box",
              }}
            />
          </label>

          {error && (
            <div
              style={{
                marginBottom: 18,
                padding: 12,
                borderRadius: 9,
                background: "#fee2e2",
                color: "#991b1b",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              minHeight: 50,
              border: "none",
              borderRadius: 10,
              background: "#FA994F",
              color: "#ffffff",
              fontSize: 16,
              fontWeight: 900,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.65 : 1,
            }}
          >
            {isSubmitting ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>
      </div>
    </main>
  );
}
