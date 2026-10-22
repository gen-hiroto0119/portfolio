declare module "*.ttf" {
  const data: Uint8Array<ArrayBuffer>;
  export default data;
}

declare module "*.woff" {
  const data: Uint8Array<ArrayBuffer>;
  export default data;
}

declare module "*.svg" {
  const content: string;
  export default content;
}
