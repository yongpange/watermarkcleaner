import { Metadata } from "next";
import ConvertClient from "./client";

export const metadata: Metadata = {
  title: "Convert Files - Instant Document Conversion",
  description: "Convert your PDF, DOCX, and TXT files to Markdown format instantly. No sign-up required.",
};

export default function ConvertPage() {
  return <ConvertClient />;
}

