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
        if (byte_hex.length === 1) { byte_hex = "0" + byte_hex; } // Pad with 0 if length is 1
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