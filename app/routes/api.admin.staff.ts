import { supabase } from "../services/supabase.server";
import { requireStaff } from "../services/staffAuth.server";

export async function loader({ request }: { request: Request }) {
  try {
    await requireStaff(request, ["ADMIN"]);

    const { data: staff, error } = await supabase
      .from("staff_profiles")
      .select(
        `
        id,
        name,
        role,
        active
      `,
      )
      .in("role", ["BAR", "KITCHEN"])
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Staff fetch error:", error);

      return Response.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      staff,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}
