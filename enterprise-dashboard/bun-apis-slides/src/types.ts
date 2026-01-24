export type SlideType =
  | "cover"
  | "toc"
  | "section"
  | "subsection"
  | "content"
  | "code"
  | "demo"
  | "summary"
  | "final";

export type ApiCategory = "formatting" | "async" | "debugging" | "security" | "comparison" | "integration";

export interface Section {
  id: string;
  title: string;
  icon: string;
  api: string;
  category: ApiCategory;
  slides: string[]; // slide IDs
}

export interface Slide {
  id: string;
  number: number;
  type: SlideType;
  sectionId?: string;
  title: string;
  subtitle?: string;
  content: string;
  icon?: string;
  tags?: string[];
  code?: string;
}

export interface Presentation {
  meta: {
    title: string;
    subtitle: string;
    version: string;
    author: string;
  };
  sections: Section[];
  slides: Slide[];
}

export interface BuildOptions {
  outputDir: string;
  theme: "dark" | "light";
  format: "html" | "markdown";
}
