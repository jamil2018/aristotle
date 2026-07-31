export function requireCredentialReference(name: string): string {
  if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
    throw new Error("Credential reference name is invalid");
  }
  const value = process.env[name];
  if (value === undefined || value.length === 0) {
    throw new Error(`Required credential reference ${name} is unavailable`);
  }
  return value;
}
