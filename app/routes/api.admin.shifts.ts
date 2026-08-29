import { supabase } from "../services/supabase.server";
import { requireStaff } from "../services/staffAuth.server";

type CreateShiftInput = {
  userId: string;
  scheduledStart: string;
  scheduledEnd: string;
};

export async function loader({ request }: { request: Request }) {
  try {
    await requireStaff(request, ["ADMIN"]);

    const { data: shifts, error: shiftsError } = await supabase
      .from("staff_shifts")
      .select(
        `
        id,
        user_id,
        station,
        status,
        scheduled_start,
        scheduled_end,
        started_at,
        ended_at,
        created_by,
        created_at
      `,
      )
      .order("scheduled_start", {
        ascending: false,
      });

    if (shiftsError) {
      console.error("Admin shifts fetch error:", shiftsError);

      return Response.json(
        {
          success: false,
          error: shiftsError.message,
        },
        { status: 500 },
      );
    }

    const { data: staff, error: staffError } = await supabase.from(
      "staff_profiles",
    ).select(`
        id,
        name,
        role
      `);

    if (staffError) {
      console.error("Staff profiles fetch error:", staffError);

      return Response.json(
        {
          success: false,
          error: staffError.message,
        },
        { status: 500 },
      );
    }

    const staffMap = new Map(
      (staff ?? []).map((member) => [member.id, member]),
    );

    const shiftsWithStaff = (shifts ?? []).map((shift) => ({
      ...shift,
      staff: staffMap.get(shift.user_id) ?? null,
    }));

    return Response.json({
      success: true,
      shifts: shiftsWithStaff,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Admin shifts loader error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}

export async function action({ request }: { request: Request }) {
  try {
    const { user } = await requireStaff(request, ["ADMIN"]);

    const input: CreateShiftInput = await request.json();

    if (!input.userId || !input.scheduledStart || !input.scheduledEnd) {
      return Response.json(
        {
          success: false,
          error: "Staff member, start and end are required",
        },
        { status: 400 },
      );
    }

    const start = new Date(input.scheduledStart);
    const end = new Date(input.scheduledEnd);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return Response.json(
        {
          success: false,
          error: "Invalid shift date",
        },
        { status: 400 },
      );
    }

    if (end <= start) {
      return Response.json(
        {
          success: false,
          error: "Shift end must be after shift start",
        },
        { status: 400 },
      );
    }

    const { data: staffProfile, error: profileError } = await supabase
      .from("staff_profiles")
      .select("id, name, role, active")
      .eq("id", input.userId)
      .single();

    if (profileError || !staffProfile || !staffProfile.active) {
      return Response.json(
        {
          success: false,
          error: "Staff member not found",
        },
        { status: 404 },
      );
    }

    if (staffProfile.role !== "BAR" && staffProfile.role !== "KITCHEN") {
      return Response.json(
        {
          success: false,
          error: "Invalid staff role for production shift",
        },
        { status: 400 },
      );
    }

    const { data: shift, error } = await supabase
      .from("staff_shifts")
      .insert({
        user_id: staffProfile.id,
        station: staffProfile.role,
        status: "ASSIGNED",
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Create staff shift error:", error);

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
      shift,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Create shift error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}
