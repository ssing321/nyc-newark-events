import { CATEGORY_SLUGS } from "@/lib/events/query";
import type { EventCategory } from "@/lib/events/types";

export function CategoryBadge({ category }: { category: EventCategory }) {
  return (
    <span className="category-badge" data-category={CATEGORY_SLUGS[category]}>
      {category === "Arts & Theatre" ? "ARTS / THEATRE" : category.toUpperCase()}
    </span>
  );
}
