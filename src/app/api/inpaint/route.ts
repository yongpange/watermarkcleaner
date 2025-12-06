import { NextRequest, NextResponse } from "next/server";

// Fal.ai API configuration
const FAL_API_URL = "https://queue.fal.run/fal-ai/flux-pro/v1.1-ultra/inpaint";
const FAL_API_KEY = process.env.FAL_AI_API_KEY;

// Maximum file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface FalResponse {
  images?: Array<{ url: string }>;
  image?: { url: string };
  error?: string;
}

interface FalQueueResponse {
  request_id: string;
  status: string;
}

interface FalResultResponse {
  images?: Array<{ url: string }>;
  image?: { url: string };
  error?: string;
}

// Helper function to convert File/Blob to base64 data URL
async function fileToBase64(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = file.type || "image/png";
  return `data:${mimeType};base64,${base64}`;
}

// Helper function to poll for result
async function pollForResult(
  requestId: string,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<FalResultResponse> {
  const statusUrl = `https://queue.fal.run/fal-ai/flux-pro/v1.1-ultra/inpaint/requests/${requestId}/status`;
  const resultUrl = `https://queue.fal.run/fal-ai/flux-pro/v1.1-ultra/inpaint/requests/${requestId}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Check status
    const statusResponse = await fetch(statusUrl, {
      method: "GET",
      headers: { Authorization: `Key ${FAL_API_KEY}` },
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to check status: ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();

    if (statusData.status === "COMPLETED") {
      // Fetch result
      const resultResponse = await fetch(resultUrl, {
        method: "GET",
        headers: { Authorization: `Key ${FAL_API_KEY}` },
      });

      if (!resultResponse.ok) {
        throw new Error(`Failed to fetch result: ${resultResponse.statusText}`);
      }

      return await resultResponse.json();
    }

    if (statusData.status === "FAILED") {
      throw new Error(statusData.error || "Processing failed");
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Processing timeout - please try again");
}

export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!FAL_API_KEY) {
      return NextResponse.json(
        { error: "FAL_AI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const image = formData.get("image") as File | null;
    const mask = formData.get("mask") as File | null;
    const prompt = (formData.get("prompt") as string) || "Remove the watermark and restore the original image seamlessly";

    // Validate inputs
    if (!image || !mask) {
      return NextResponse.json(
        { error: "Both image and mask files are required" },
        { status: 400 }
      );
    }

    // Check file sizes
    if (image.size > MAX_FILE_SIZE || mask.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 20MB" },
        { status: 400 }
      );
    }

    // Convert to base64
    const imageBase64 = await fileToBase64(image);
    const maskBase64 = await fileToBase64(mask);

    // Call Fal.ai API (queue mode for longer processing)
    const response = await fetch(FAL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageBase64,
        mask_url: maskBase64,
        prompt: prompt,
        num_images: 1,
        safety_tolerance: "2",
        output_format: "png",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fal.ai API error:", errorText);
      return NextResponse.json(
        { error: `API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data: FalQueueResponse | FalResponse = await response.json();

    // Check if we got a request_id (queue mode) or direct result
    if ("request_id" in data) {
      // Poll for result
      const result = await pollForResult(data.request_id);
      const imageUrl = result.images?.[0]?.url || result.image?.url;

      if (!imageUrl) {
        return NextResponse.json(
          { error: "No image returned from API" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, imageUrl });
    } else {
      // Direct result
      const imageUrl = data.images?.[0]?.url || data.image?.url;

      if (!imageUrl) {
        return NextResponse.json(
          { error: data.error || "No image returned from API" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, imageUrl });
    }
  } catch (error) {
    console.error("Inpaint API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    );
  }
}

