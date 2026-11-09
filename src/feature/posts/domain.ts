export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
};

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
