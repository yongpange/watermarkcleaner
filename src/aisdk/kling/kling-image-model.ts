import type { ImageModelV1, ImageModelV1CallWarning } from "@ai-sdk/provider";
import { KlingImageModelId, KlingImageSettings } from "./kling-image-settings";

import { FetchFunction } from "@ai-sdk/provider-utils";
import type { Resolvable } from "@ai-sdk/provider-utils";
import { newClient } from "./image-generation";

interface KlingImageModelConfig {
  accessKey: string;
  secretKey: string;
  provider: string;
  baseURL: string;
  headers: Resolvable<Record<string, string | undefined>>;
  fetch?: FetchFunction;
}

export class KlingImageModel implements ImageModelV1 {
  readonly specificationVersion = "v1";

  readonly modelId: KlingImageModelId;
  readonly settings: KlingImageSettings;

  private readonly config: KlingImageModelConfig;

  get provider(): string {
    return this.config.provider;
  }

  get maxImagesPerCall(): number {
    return this.settings.maxImagesPerCall ?? 1;
  }

  constructor(
    modelId: KlingImageModelId,
    settings: KlingImageSettings,
    config: KlingImageModelConfig
  ) {
    this.modelId = modelId;
    this.settings = settings;
    this.config = config;
  }

  async doGenerate({
    prompt,
    n,
    aspectRatio,
    size,
    seed,
    providerOptions,
    headers,
    abortSignal,
  }: Parameters<ImageModelV1["doGenerate"]>[0]): Promise<
    Awaited<ReturnType<ImageModelV1["doGenerate"]>>
  > {
    const warnings: Array<ImageModelV1CallWarning> = [];
    let images: Array<Uint8Array> = [];
    const imgUrls: Array<string> = [];
    const currentDate = new Date();

    try {
      if (!this.config.accessKey || !this.config.secretKey) {
        throw new Error("Kling access key or secret key is not set");
      }

      const client = await newClient({
        accessKey: this.config.accessKey,
        secretKey: this.config.secretKey,
      });

      const task = await client.createTask({
        model: this.modelId,
        prompt,
        n,
        size,
        aspect_ratio: aspectRatio,
        ...(providerOptions.kling ?? {}),
      });

      if (!task.data || typeof task.data !== 'object' || !('task_id' in task.data)) {
        throw new Error(task.message);
      }

      const taskId = (task.data as { task_id: string }).task_id;

      const maxAttempts = 20;
      const pollingInterval = 3000;
      let attempts = 0;

      while (attempts < maxAttempts) {
        const result = await client.queryTask({ task_id: taskId });

        if (!result.data || typeof result.data !== 'object' || !('task_status' in result.data)) {
          continue;
        }

        const resultData = result.data as {
          task_status: string;
          task_status_msg?: string;
          task_result?: {
            images?: Array<{ url: string }>;
          };
        };

        if (resultData.task_status === "succeed") {
          if (resultData.task_result?.images) {
            resultData.task_result.images.forEach((img) => {
              imgUrls.push(img.url);
            });
          }
          break;
        } else if (resultData.task_status === "failed") {
          throw new Error(resultData.task_status_msg || "Task failed");
        }

        if (abortSignal?.aborted) {
          throw new Error("Operation aborted");
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
      }

      if (attempts >= maxAttempts) {
        throw new Error("Task timed out");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      warnings.push({
        type: "other",
        message: errorMessage,
      });
    }

    if (imgUrls.length === 0) {
      warnings.push({
        type: "other",
        message: "No images generated",
      });
    } else {
      images = await Promise.all(
        imgUrls.map(async (url) => {
          const response = await fetch(url);
          return new Uint8Array(await response.arrayBuffer());
        })
      );
    }

    return {
      images,
      warnings,
      response: {
        timestamp: currentDate,
        modelId: this.modelId,
        headers: undefined,
      },
    };
  }
}
