export interface ColorSpace<T extends readonly number[] = [number, number, number]> {
  name: string;
  min: T;
  max: T;
  channel: { [K in keyof T]: string };
  alias?: string[];
}
