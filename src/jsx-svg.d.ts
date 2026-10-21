export {};

declare module "hono/jsx" {
  namespace JSX {
    interface IntrinsicElements {
      svg: JSX.HTMLAttributes;
      path: JSX.HTMLAttributes;
      g: JSX.HTMLAttributes;
      rect: JSX.HTMLAttributes;
      defs: JSX.HTMLAttributes;
      linearGradient: JSX.HTMLAttributes;
      stop: JSX.HTMLAttributes;
      clipPath: JSX.HTMLAttributes;
    }
  }
}

declare module "hono/jsx/dom" {
  namespace JSX {
    interface IntrinsicElements {
      svg: JSX.HTMLAttributes;
      path: JSX.HTMLAttributes;
    }
  }
}
