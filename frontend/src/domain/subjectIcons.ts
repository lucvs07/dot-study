import { Atom, Code, Hourglass, PenTool, Sigma, type LucideIcon } from "lucide-react";
import type { SubjectIcon } from "@/services/contracts";

export const SUBJECT_ICONS: Record<SubjectIcon, LucideIcon> = {
  sigma: Sigma,
  atom: Atom,
  hourglass: Hourglass,
  "pen-tool": PenTool,
  code: Code,
};
