import { Metadata } from "next";
import { Suspense } from "react";
import WorkspaceClient from "./client";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Workspace - Edit Your Documents",
  description: "Advanced document editing workspace with real-time preview and export options.",
};

function WorkspaceLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading workspace...</p>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <WorkspaceClient />
    </Suspense>
  );
}

