import { NextRequest, NextResponse } from "next/server";

// Fal.ai API configuration - 使用 inpaint 模型
const FAL_API_URL = "https://queue.fal.run/fal-ai/inpaint";
const FAL_API_KEY = process.env.FAL_AI_API_KEY;

export const runtime = 'edge'; // Explicitly set Edge Runtime

// Maximum file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Helper function to convert File/Blob to base64 data URL
async function fileToBase64(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  // Edge runtime supports basic Buffer via polyfill or native APIs in newer environments,
  // but standard 'buffer' module might be limited.
  // Using standard ArrayBuffer to Base64 conversion usually works in Edge.
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const mimeType = file.type || "image/png";
  return `data:${mimeType};base64,${base64}`;
}

// 轮询函数 - 用于 queue 模式
async function pollForResult(
  requestId: string,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<any> {
  const statusUrl = `https://queue.fal.run/fal-ai/inpaint/requests/${requestId}/status`;
  const resultUrl = `https://queue.fal.run/fal-ai/inpaint/requests/${requestId}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // 检查状态
    const statusResponse = await fetch(statusUrl, {
      method: "GET",
      headers: { Authorization: `Key ${FAL_API_KEY}` },
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to check status: ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();

    if (statusData.status === "COMPLETED") {
      // 获取结果
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

    // 等待下次轮询
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
    // const originalWidth = parseInt(formData.get("originalWidth")?.toString() || "1024");
    // const originalHeight = parseInt(formData.get("originalHeight")?.toString() || "1024");

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

    // Call Fal.ai API - inpaint 模型
    const response = await fetch(FAL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_name: "diffusers/stable-diffusion-xl-1.0-inpainting-0.1",
        prompt: prompt,
        image_url: imageBase64,
        mask_url: maskBase64,
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

    const data = await response.json();
    console.log("Fal.ai API response:", JSON.stringify(data, null, 2));

    let imageUrl: string | undefined;

    // 检查是否为队列响应
    if ("request_id" in data) {
      // 轮询获取结果
      const result = await pollForResult(data.request_id);
      console.log("Fal.ai final result:", JSON.stringify(result, null, 2));
      imageUrl = result.image?.url || result.images?.[0]?.url;
    } else {
      // 直接响应
      imageUrl = data.image?.url || data.images?.[0]?.url;
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image returned from API", debug: data },
        { status: 500 }
      );
    }

    // 直接返回图片 URL (Cloudflare Pages 边缘函数无需下载再返回，除非为了跨域或缓存)
    // 或者，如果前端需要 Base64，我们可以 fetch 并转 Base64，但不再 resize。
    // 为了保持接口兼容性（前端可能期望 Base64），我们 fetching 并返回 Base64。

    try {
        const generatedImage = await fetch(imageUrl);
        const generatedBuffer = await generatedImage.arrayBuffer();
        
        let binary = '';
        const bytes = new Uint8Array(generatedBuffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64Image = btoa(binary);
        const sizedImageUrl = `data:image/png;base64,${base64Image}`;

        return NextResponse.json({ success: true, imageUrl: sizedImageUrl });
    } catch (fetchError) {
        console.error("Fetch image error:", fetchError);
        // Fallback to URL if fetch fails
        return NextResponse.json({ success: true, imageUrl: imageUrl });
    }

  } catch (error) {
    console.error("Inpaint API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    );
  }
}


