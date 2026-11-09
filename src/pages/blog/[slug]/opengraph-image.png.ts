import type { APIRoute, GetStaticPaths } from "astro";
import { getAllPosts } from "@/feature/posts/service";
import { createPortfolioImage } from "@/lib/og/create-portfolio-image";

export const getStaticPaths = (async () => {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { title: post.title },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  createPortfolioImage({ label: "Blog", title: props.title });
