import MDEditor from "@uiw/react-md-editor";
import "./markdown.css";
import Image from "next/image";

export default function Markdown({ content }: { content: string }) {
  return (
    <MDEditor.Markdown
      className="markdown bg-background"
      source={content}
      components={{
        a: ({ children, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        img: ({ src, alt, ...props }) => (
          <div className="w-full my-6">
            <img
              src={src}
              alt={alt || "Image"}
              className="w-full h-auto max-w-[1920px] mx-auto rounded-lg shadow-md"
              loading="lazy"
              {...props}
            />
          </div>
        ),
      }}
    />
  );
}
