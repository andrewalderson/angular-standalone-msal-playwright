import { existsSync, statSync } from 'node:fs';

export function tryGetEnviromentVariable(
  name: string,
  defaultValue?: string,
): string {
  const value = process.env[name] ?? defaultValue;
  if (!value) {
    throw new Error(`${name} must be set in the .env file`);
  }
  return value;
}

export function fileOlderThan(filePath: string, durationMs: number) {
  try {
    // Ensure file exists
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get file stats
    const stats = statSync(filePath);

    // Last modification time
    const mtime = stats.mtime.getTime();

    // Current time
    const now = Date.now();

    // Compare age
    return now - mtime > durationMs;
  } catch (err: any) {
    console.error(`Error checking file age: ${err.message}`);
    return false;
  }
}
