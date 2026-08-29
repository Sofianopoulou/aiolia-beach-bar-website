import { type ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabaseClient } from "../services/supabase.client";

type StaffRole = "BAR" | "KITCHEN" | "ADMIN";

type StaffRouteGuardProps = {
  allowedRole: "BAR" | "KITCHEN" | "ADMIN";
  children: ReactNode;
};

export default function StaffRouteGuard({
  allowedRole,
  children,
}: StaffRouteGuardProps) {
  const navigate = useNavigate();

  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session?.user) {
        navigate("/staff/login", {
          replace: true,
        });

        return;
      }

      const { data: profile, error } = await supabaseClient
        .from("staff_profiles")
        .select("role, active")
        .eq("id", session.user.id)
        .single();

      if (error || !profile || !profile.active) {
        await supabaseClient.auth.signOut();

        navigate("/staff/login", {
          replace: true,
        });

        return;
      }

      const role = profile.role as StaffRole;

      if (role !== allowedRole) {
        if (role === "BAR") {
          navigate("/staff/bar", {
            replace: true,
          });
          return;
        }

        if (role === "KITCHEN") {
          navigate("/staff/kitchen", {
            replace: true,
          });
          return;
        }

        if (role === "ADMIN") {
          navigate("/admin", {
            replace: true,
          });
          return;
        }

        navigate("/staff/login", {
          replace: true,
        });

        return;
      }

      setIsChecking(false);
    }

    checkAccess();
  }, [allowedRole, navigate]);

  if (isChecking) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f3f4f6",
        }}
      >
        Checking staff access...
      </main>
    );
  }

  return <>{children}</>;
}
