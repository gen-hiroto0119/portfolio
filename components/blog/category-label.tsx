import type { BlogCategory } from "@/lib/content/schema";

import { getCategoryLabel } from "./category-utils";

type CategoryLabelProps = {
  category: BlogCategory;
};

export function CategoryLabel({ category }: CategoryLabelProps) {
  return <span className="text-sm text-muted-foreground">{getCategoryLabel(category)}</span>;
}
