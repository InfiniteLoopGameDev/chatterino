import { PublicKey, PrivateKey } from "./encryption";

export function bigint_to_uint8array (number: bigint) {
    let hex = number.toString(16); // Convert to hex
    if (hex.length % 2) { hex = "0" + hex; } // Pad with 0 if length is odd
    let split_hex = hex.match(/.{1,2}/g); // Split into array of bytes
    if (!split_hex) { throw new Error("Could not split hex"); }
    let u8 = new Uint8Array(split_hex.map((byte) => parseInt(byte, 16))); // Convert to Uint8Array
    return u8;
}

function uint8array_to_bigint (u8: Uint8Array) {
    let hex = "";
    u8.forEach((byte) => { // Convert to hex
        let byte_hex = byte.toString(16);
        byte_hex = byte_hex.padStart(2, "0") // Pad with 0 if length is 1
        hex += byte_hex;
    });
    return BigInt("0x" + hex); // Convert to bigint
}

function uint8array_to_base64 (u8: Uint8Array) {
    let reduced = u8.reduce((acc, cur) => acc + String.fromCharCode(cur), ""); // Convert to string
    return btoa(reduced); // Convert to base64
}

function base64_to_uint8array (base64: string) {
    let reduced = atob(base64).split("").map((char) => char.charCodeAt(0)); // Convert to Uint8Array
    return new Uint8Array(reduced);
}

export function message_encode (text: bigint) {
    let u8 = bigint_to_uint8array(text); // Convert the number to a Uint8Array
    return uint8array_to_base64(u8); // Convert Uint8Array to a base64 string
}

export function message_decode (message: string) {
    let u8 = base64_to_uint8array(message); // Convert the base64 string to a Uint8Array
    return uint8array_to_bigint(u8); // Convert the Uint8Array to a number
}
export function key_export (key: PublicKey): string
export function key_export (key: PrivateKey): string
export function key_export (key: PublicKey | PrivateKey) {
    let key_type: string;
    let u8n = bigint_to_uint8array(key.n); // Convert n to a Uint8Array
    let n = uint8array_to_base64(u8n); // Convert n to a base64 string
    let u8alt: Uint8Array;
    if ("d" in key) { // If the key is a PrivateKey
        key_type = "PrivateKey" // Set key type
        u8alt = bigint_to_uint8array(key.d); // Convert d to a Uint8Array
    } else if ("e" in key) { // If the key is a PublicKey
        key_type = "PublicKey"
        u8alt = bigint_to_uint8array(key.e); // Convert e to a Uint8Array
    } else { throw new Error("Invalid key type"); }
    let alt = uint8array_to_base64(u8alt); // Convert e to a base64 string
    return btoa(`${key_type}.${n}.${alt}`); // Return the base64 strings joined by a period
}

export function key_import (key: string): PublicKey | PrivateKey {
    let [key_type, n, alt] = atob(key).split("."); // Split the base64 strings
    let u8n = base64_to_uint8array(n); // Convert n to a Uint8Array
    let n_bigint = uint8array_to_bigint(u8n); // Convert n to a bigint
    let u8alt = base64_to_uint8array(alt); // Convert e to a Uint8Array
    let alt_bigint = uint8array_to_bigint(u8alt); // Convert e to a bigint
    if (key_type === "PrivateKey") {
        return new PrivateKey(n_bigint, alt_bigint); // Return a PrivateKey object
    } else if (key_type === "PublicKey") {
        return new PublicKey(n_bigint, alt_bigint); // Return a PublicKey object
    } else { throw new Error("Invalid key type"); }
}