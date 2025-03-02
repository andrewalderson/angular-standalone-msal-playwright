export function base64Decode(input: string): string {
  return new TextDecoder().decode(base64DecToArr(input));
}

export function base64DecToArr(base64String: string): Uint8Array {
  let encodedString = base64String.replace(/-/g, '+').replace(/_/g, '/');
  switch (encodedString.length % 4) {
    case 0:
      break;
    case 2:
      encodedString += '==';
      break;
    case 3:
      encodedString += '=';
      break;
    default:
      throw new Error('Invalid base64 string');
  }
  const binString = atob(encodedString);
  return Uint8Array.from(binString, (m) => m.codePointAt(0) || 0);
}
