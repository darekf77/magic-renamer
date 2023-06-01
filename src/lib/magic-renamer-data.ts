import { path } from "tnp-core"

export const toDebug = [
  // 'lazy.module.ts'
]

export function shouldDebug(filePath:string) {
  return toDebug.includes(path.basename(filePath));
}
