import { NextResponse } from "next/server";

import { prisma } from "../../../core/database/prisma-client";

type CreateTargetBody = {
  id?: unknown;
  name?: unknown;
  address?: unknown;
};

export async function GET() {
  try {
    const targets =
      await prisma.target.findMany({
        orderBy: {
          createdAt: "asc",
        },
      });

    return NextResponse.json({
      status: "OK",
      targets,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "Error",
        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as CreateTargetBody;

    if (
      typeof body.id !== "string" ||
      body.id.trim().length === 0
    ) {
      return NextResponse.json(
        {
          status: "Error",
          message:
            "Target id is required",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof body.name !== "string" ||
      body.name.trim().length === 0
    ) {
      return NextResponse.json(
        {
          status: "Error",
          message:
            "Target name is required",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof body.address !== "string" ||
      body.address.trim().length === 0
    ) {
      return NextResponse.json(
        {
          status: "Error",
          message:
            "Target address is required",
        },
        {
          status: 400,
        },
      );
    }

    const target =
      await prisma.target.create({
        data: {
          id:
            body.id.trim(),

          name:
            body.name.trim(),

          address:
            body.address.trim(),
        },
      });

    return NextResponse.json(
      {
        status: "Created",
        target,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    if (
      message.includes(
        "Unique constraint",
      )
    ) {
      return NextResponse.json(
        {
          status: "Error",
          message:
            "A target with this id already exists",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        status: "Error",
        message,
      },
      {
        status: 500,
      },
    );
  }
}