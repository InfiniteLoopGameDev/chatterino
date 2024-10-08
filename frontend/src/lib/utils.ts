import type { Key } from "./rsa";
import { PrivateKey, PublicKey } from "./rsa";

// Hacky but it works
type IArray = ArrayLike<any> & {
    slice(begin: number, end?: number): IArray;
}

export type TypedArray = ArrayLike<any> & {
    BYTES_PER_ELEMENT: number;
    buffer: ArrayBuffer;
    set(array: ArrayLike<number | bigint>, offset?: number): void;
    fill(value: number | bigint, start?: number, end?: number): void;
};
type TypedArrayConstructor<T> = {
    new (): T;
    new (size: number): T;
    new (buffer: ArrayBuffer): T;
    BYTES_PER_ELEMENT: number;
}

export function bigint_to_uint8array (number: bigint) {
    let hex = number.toString(16); // Convert to hex
    if (hex.length % 2) { hex = "0" + hex; } // Pad with 0 if length is odd
    let split_hex = hex.match(/.{1,2}/g); // Split into array of bytes
    if (!split_hex) { throw new Error("Could not split hex"); }
    let u8 = new Uint8Array(split_hex.map((byte) => parseInt(byte, 16))); // Convert to Uint8Array
    return u8;
}

export function uint8array_to_bigint (u8: Uint8Array) {
    let hex = "";
    u8.forEach((byte) => { // Convert to hex
        let byte_hex = byte.toString(16);
        byte_hex = byte_hex.padStart(2, "0") // Pad with 0 if length is 1
        hex += byte_hex;
    });
    return BigInt("0x" + hex); // Convert to bigint
}

export function uint8array_to_base64 (u8: Uint8Array) {
    let reduced = u8.reduce((acc, cur) => acc + String.fromCharCode(cur), ""); // Convert to string
    return btoa(reduced); // Convert to base64
}

export function base64_to_uint8array (base64: string) {
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

export function key_export (key: Key) {
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

export function key_import (key: string): Key {
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

export function rotate_left(number: bigint, shifts: bigint, size: number) {
    let bitMask = (1n << BigInt(size)) - 1n;
    number = number & bitMask
    shifts = shifts % BigInt(size);
    return ((number << shifts) & bitMask) | ((number) >> (BigInt(size) - shifts))
}

export function rotate_right(number: bigint, shifts: bigint, size: number) {
    let bitMask = (1n << BigInt(size)) - 1n;
    number = number & bitMask
    shifts = shifts % BigInt(size);
    return (number >> shifts) | (((number) << (BigInt(size) - shifts)) & bitMask)
}

export function split_chunks<T extends IArray>(array: T, chunk_size: number): T[] {
    const n = Math.ceil(array.length /chunk_size);
    return Array.from({ length: n }, (v,i) => 
        array.slice(i * chunk_size, i * chunk_size + chunk_size) as T)
}

export function xor_array(array1: BigUint64Array, array2: BigUint64Array): BigUint64Array {
    return new BigUint64Array(array1).map( (x, i) => x ^ array2[i])
}

export function merge_uint64_array(array1: BigUint64Array, array2: BigUint64Array): BigUint64Array {
    var mergedArray = new BigUint64Array(array1.length + array2.length);
    mergedArray.set(array1);
    mergedArray.set(array2, array1.length);
    return mergedArray
}

export function padd_typed_array<T extends TypedArray>(array: T, length: number): T {
    let paddedArray = new (array.constructor as TypedArrayConstructor<T>)(length);
    paddedArray.set(array);
    paddedArray.fill(array[0].constructor(0), array.length);
    return paddedArray
}

export function object_to_uintarray(obj: object): Uint32Array {
    let untyped_array = []
    let current_index = 0
    let current_element = obj[current_index.toString()];

    while (current_element != undefined) {
        untyped_array.push(current_element);
        current_index++;
        current_element = obj[current_index.toString()];
    }

    return new Uint32Array(untyped_array);
}