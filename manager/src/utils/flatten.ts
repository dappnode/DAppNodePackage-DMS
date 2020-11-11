export function flatten<T>(arrays: (T | T[])[]): T[] {
  return arrays.flat() as T[];
}
