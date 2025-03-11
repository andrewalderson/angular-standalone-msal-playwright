export function tryGetEnviromentVariable(
  name: string,
  defaultValue?: string
): string {
  const value = process.env[name] ?? defaultValue;
  if (!value) {
    throw new Error(`${name} must be set in the .env file`);
  }
  return value;
}
