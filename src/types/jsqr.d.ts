declare module "jsqr" {
  type JsQR = (
    data: Uint8ClampedArray,
    width: number,
    height: number
  ) => { data: string } | null;

  const jsQR: JsQR;
  export default jsQR;
}
