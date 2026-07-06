import type { IdeaNote } from "@/lib/content/schema";

export type IdeaStatus = IdeaNote["status"];

export function getStatusLabel(status: IdeaStatus): string {
  switch (status) {
    case "seedling":
      return "Seedling";
    case "budding":
      return "Budding";
    case "evergreen":
      return "Evergreen";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
