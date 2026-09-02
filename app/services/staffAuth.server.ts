import { supabase } from "./supabase.server";

export type StaffRole = "BAR" | "KITCHEN" | "WAITER" | "ADMIN";

export async function requireStaff(
  request: Request,
  allowedRoles: StaffRole[],
) {
  const authorization = request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Response("Unauthorized", {
      status: 401,
    });
  }

  const token = authorization.slice("Bearer ".length);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    throw new Response("Unauthorized", {
      status: 401,
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from("staff_profiles")
    .select("id, name, role, active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.active) {
    throw new Response("Forbidden", {
      status: 403,
    });
  }

  const role = profile.role as StaffRole;

  if (role !== "ADMIN" && !allowedRoles.includes(role)) {
    throw new Response("Forbidden", {
      status: 403,
    });
  }

  return {
    user,
    profile,
  };
}
