// Half of an import cycle inside the core layer.
import { b } from "./b.ts";

export function a(): number {
  return b() + 1;
}
