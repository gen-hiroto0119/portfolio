export function SiteNavigation({ pathname }: { pathname: string }) {
  const home = pathname === "/";
  return <a href={home ? "/blog" : "/"}>{home ? "Blog" : "Home"}</a>;
}
