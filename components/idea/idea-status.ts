import type { GardenNote } from "@/lib/content/schema";

export type GardenStatus = GardenNote["status"];

export function getStatusLabel(status: GardenStatus): string {
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
