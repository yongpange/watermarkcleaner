import { KlingVideoModelId, KlingVideoSettings } from "./kling-video-settings";
import type { VideoModelV1, VideoModelV1CallWarning } from "@/aisdk/provider";

import { FetchFunction } from "@ai-sdk/provider-utils";
import type { Resolvable } from "@ai-sdk/provider-utils";
import { newClient } from "./text2video";

interface KlingVideoModelConfig {
  accessKey: string;
  secretKey: string;
  provider: string;
  baseURL: string;
  headers: Resolvable<Record<string, string | undefined>>;
  fetch?: FetchFunction;
}

export class KlingVideoModel implements VideoModelV1 {
  readonly specificationVersion = "v1";

  readonly modelId: KlingVideoModelId;
  readonly settings: KlingVideoSettings;

  private readonly config: KlingVideoModelConfig;

  get provider(): string {
    return this.config.provider;
  }

  get maxVideosPerCall(): number {
    return this.settings.maxVideosPerCall ?? 1;
  }

  constructor(
    modelId: KlingVideoModelId,
    settings: KlingVideoSettings,
    config: KlingVideoModelConfig
  ) {
    this.modelId = modelId;
    this.settings = settings;
    this.config = config;
  }

  async doGenerate({
    prompt,
    n,
    providerOptions,
    headers,
    abortSignal,
  }: Parameters<VideoModelV1["doGenerate"]>[0]): Promise<
    Awaited<ReturnType<VideoModelV1["doGenerate"]>>
  > {
    const warnings: Array<VideoModelV1CallWarning> = [];
    let videos: Array<Uint8Array> = [];

    const videoUrls: Array<string> = [];

    if (!this.config.accessKey || !this.config.secretKey) {
      warnings.push({
        type: "other",
        message: "Kling access key or secret key is not set",
      });
      return { videos, warnings };
    }

    try {
      const client = await newClient({
        accessKey: this.config.accessKey,
        secretKey: this.config.secretKey,
      });

      const task = await client.createTask({
        model: this.modelId,
        prompt,
        n,
        ...(providerOptions?.kling ?? {}),
      });

      if (!task.data || typeof task.data !== 'object' || !('task_id' in task.data)) {
        warnings.push({
          type: "other",
          message: task.message,
        });
        return { videos, warnings };
      }

      const taskId = (task.data as { task_id: string }).task_id;

      const maxAttempts = 20;
      const pollingInterval = 30000;
      let attempts = 0;

      while (attempts < maxAttempts) {
        const result = await client.queryTask({ task_id: taskId });
        console.log("kling gen videos result:", JSON.stringify(result));

        if (!result.data || typeof result.data !== 'object' || !('task_status' in result.data)) {
          continue;
        }

        const resultData = result.data as {
          task_status: string;
          task_status_msg?: string;
          task_result?: {
            videos?: Array<{ url: string }>;
          };
        };

        if (resultData.task_status === "succeed") {
          if (resultData.task_result?.videos) {
            resultData.task_result.videos.forEach((video) => {
              videoUrls.push(video.url);
            });
          }
          break;
        } else if (resultData.task_status === "failed") {
          warnings.push({
            type: "other",
            message: resultData.task_status_msg || "Task failed",
          });
          break;
        }

        if (abortSignal?.aborted) {
          throw new Error("Operation aborted");
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
      }

      if (attempts >= maxAttempts) {
        warnings.push({
          type: "other",
          message: "Task timed out",
        });
      }
    } catch (error: unknown) {
      console.error("Kling generate video failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      warnings.push({
        type: "other",
        message: errorMessage,
      });
    }

    if (videoUrls.length === 0) {
      warnings.push({
        type: "other",
        message: "No videos generated",
      });
      return { videos, warnings };
    }

    videos = await Promise.all(
      videoUrls.map(async (url) => {
        const response = await fetch(url);
        return new Uint8Array(await response.arrayBuffer());
      })
    );

    return { videos, warnings };
  }
}
