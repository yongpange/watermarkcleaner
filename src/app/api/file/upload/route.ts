import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { newStorage } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import type { FileUploadResponse } from "@/types/file";
import { MAX_FILE_SIZE, SUPPORTED_FILE_TYPES } from "@/types/file";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds ${MAX_FILE_SIZE}MB limit`,
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!Object.keys(SUPPORTED_FILE_TYPES).includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `File type ${file.type} is not supported`,
        },
        { status: 400 }
      );
    }

    // Generate unique file key
    const fileId = uuidv4();
    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const key = `uploads/${user.id}/${timestamp}-${fileId}.${fileExt}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to storage
    const storage = newStorage();
    const uploadResult = await storage.uploadFile({
      body: buffer,
      key,
      contentType: file.type,
      disposition: "inline",
    });

    // TODO: Save file record to database
    // This will be implemented in Phase 1 (Database setup)
    // await db.insert(files).values({
    //   id: fileId,
    //   userId: user.id,
    //   filename: file.name,
    //   fileType: file.type,
    //   fileSize: file.size,
    //   storageKey: key,
    //   storageUrl: uploadResult.url,
    //   createdAt: new Date(),
    // });

    const response: FileUploadResponse = {
      success: true,
      file: {
        id: fileId,
        url: uploadResult.url || "",
        key: uploadResult.key || "",
        filename: file.name,
        size: file.size,
        type: file.type,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}

