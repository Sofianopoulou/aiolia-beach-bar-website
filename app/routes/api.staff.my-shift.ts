import { supabase } from "../services/supabase.server";
import { requireStaff } from "../services/staffAuth.server";

type ShiftAction = "START" | "END";

export async function loader({ request }: { request: Request }) {
  try {
    const { user, profile } = await requireStaff(request, ["BAR", "KITCHEN"]);

    if (profile.role !== "BAR" && profile.role !== "KITCHEN") {
      return Response.json(
        {
          success: false,
          error: "Only BAR and KITCHEN staff can access personal shifts.",
        },
        { status: 403 },
      );
    }

    const { data: shifts, error } = await supabase
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
      .eq("user_id", user.id)
      .in("status", ["ASSIGNED", "ACTIVE"])
      .order("scheduled_start", {
        ascending: true,
      });

    if (error) {
      console.error("Load personal shift error:", error);

      return Response.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    // Prefer an ACTIVE shift if one exists.
    // Otherwise use the next ASSIGNED shift.
    const activeShift = shifts?.find((shift) => shift.status === "ACTIVE");

    const assignedShift = shifts?.find((shift) => shift.status === "ASSIGNED");

    const shift = activeShift ?? assignedShift ?? null;

    return Response.json({
      success: true,
      shift,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Personal shift loader error:", error);

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
    const { user, profile } = await requireStaff(request, ["BAR", "KITCHEN"]);

    if (profile.role !== "BAR" && profile.role !== "KITCHEN") {
      return Response.json(
        {
          success: false,
          error: "Only BAR and KITCHEN staff can update personal shifts.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const action = body.action as ShiftAction;

    if (action !== "START" && action !== "END") {
      return Response.json(
        {
          success: false,
          error: "Invalid shift action",
        },
        { status: 400 },
      );
    }

    if (action === "START") {
      const { data: existingActiveShift, error: activeError } = await supabase
        .from("staff_shifts")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "ACTIVE")
        .maybeSingle();

      if (activeError) {
        console.error("Check active shift error:", activeError);

        return Response.json(
          {
            success: false,
            error: activeError.message,
          },
          { status: 500 },
        );
      }

      if (existingActiveShift) {
        return Response.json(
          {
            success: false,
            error: "You already have an active shift.",
          },
          { status: 409 },
        );
      }

      const { data: assignedShifts, error: assignedError } = await supabase
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
            ended_at
          `,
        )
        .eq("user_id", user.id)
        .eq("status", "ASSIGNED")
        .order("scheduled_start", {
          ascending: true,
        });

      if (assignedError) {
        console.error("Load assigned shift error:", assignedError);

        return Response.json(
          {
            success: false,
            error: assignedError.message,
          },
          { status: 500 },
        );
      }

      const shiftToStart = assignedShifts?.[0];

      if (!shiftToStart) {
        return Response.json(
          {
            success: false,
            error: "No assigned shift found.",
          },
          { status: 404 },
        );
      }

      if (shiftToStart.station !== profile.role) {
        return Response.json(
          {
            success: false,
            error: "This shift does not match your staff role.",
          },
          { status: 403 },
        );
      }

      const now = new Date().toISOString();

      const { data: shift, error: updateError } = await supabase
        .from("staff_shifts")
        .update({
          status: "ACTIVE",
          started_at: now,
        })
        .eq("id", shiftToStart.id)
        .eq("user_id", user.id)
        .eq("status", "ASSIGNED")
        .select()
        .single();

      if (updateError) {
        console.error("Start shift error:", updateError);

        return Response.json(
          {
            success: false,
            error: updateError.message,
          },
          { status: 500 },
        );
      }

      return Response.json({
        success: true,
        shift,
      });
    }

    if (action === "END") {
      const { data: activeShift, error: activeError } = await supabase
        .from("staff_shifts")
        .select(
          `
            id,
            user_id,
            station,
            status,
            started_at
          `,
        )
        .eq("user_id", user.id)
        .eq("status", "ACTIVE")
        .maybeSingle();

      if (activeError) {
        console.error("Load active shift error:", activeError);

        return Response.json(
          {
            success: false,
            error: activeError.message,
          },
          { status: 500 },
        );
      }

      if (!activeShift) {
        return Response.json(
          {
            success: false,
            error: "No active shift found.",
          },
          { status: 404 },
        );
      }

      if (activeShift.station !== profile.role) {
        return Response.json(
          {
            success: false,
            error: "This shift does not match your staff role.",
          },
          { status: 403 },
        );
      }

      const now = new Date().toISOString();

      const { data: shift, error: updateError } = await supabase
        .from("staff_shifts")
        .update({
          status: "CLOSED",
          ended_at: now,
        })
        .eq("id", activeShift.id)
        .eq("user_id", user.id)
        .eq("status", "ACTIVE")
        .select()
        .single();

      if (updateError) {
        console.error("End shift error:", updateError);

        return Response.json(
          {
            success: false,
            error: updateError.message,
          },
          { status: 500 },
        );
      }

      return Response.json({
        success: true,
        shift,
      });
    }

    return Response.json(
      {
        success: false,
        error: "Unsupported action",
      },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Personal shift action error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}
