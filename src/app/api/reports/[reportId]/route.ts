import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { resolveReport, dismissReport } from "@/services/report.service";

const updateSchema = z.object({
  status: z.enum(["resolved", "dismissed"]),
  resolutionNote: z.string().max(2000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const user = await requireAuth();
    const { reportId } = await params;
    const body = await request.json();
    const input = updateSchema.parse(body);

    let report;

    if (input.status === "resolved") {
      report = await resolveReport(
        reportId,
        user.id,
        input.resolutionNote || ""
      );
    } else {
      report = await dismissReport(reportId, user.id);
    }

    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
