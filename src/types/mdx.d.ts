declare module "*.mdx" {
  import type { ReactElement } from "react";
  const content: (props: Record<string, unknown>) => ReactElement;
  export default content;
}
