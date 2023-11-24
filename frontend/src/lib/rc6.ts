import * as wasm from "rc6lib"
import {rotate_left, rotate_right, split_chunks, xor_array, 
    merge_uint64_array, padd_typed_array, uint8array_to_base64, 
    base64_to_uint8array} from "./utils";

const P: { [key: number]: bigint } = {16: 0xb7e1n, 32: 0xb7e15163n, 64: 0xb7e151628aed2a6bn}
const Q: { [key: number]: bigint } = {16: 0x9e37n, 32: 0x9e3779b9n, 64: 0x9e3779b97f4a7c15n}

export class RC6Descriptor {
    wordLength: number;
    rounds: number;
    keySize: number;

    constructor(wordLength: number, rounds: number, keySize: number) {
        this.wordLength = wordLength;
        this.rounds = rounds;
        this.keySize = keySize;
    }
}

export class RC6Key {
    S: BigUint64Array; // Round Keys
    descriptor: RC6Descriptor;

    constructor(input: BigUint64Array, descriptor: RC6Descriptor) {
        this.descriptor = descriptor;
        this.S = wasm.keygen(input, descriptor.rounds);
    }
}

export function encrypt_block(plaintext: BigUint64Array, key: RC6Key): BigUint64Array {
    return wasm.encrypt_block(plaintext, key.S, key.descriptor.rounds);
}

export function decrypt_block(ciphertext: BigUint64Array, key: RC6Key): BigUint64Array {
    return wasm.decrypt_block(ciphertext, key.S, key.descriptor.rounds)
}

export function cbc_encrypt(plaintext: BigUint64Array, key: RC6Key): BigUint64Array {
    let padLength = 4 - plaintext.length % 4
    plaintext = padd_typed_array(plaintext, plaintext.length + padLength)
    let blocks = split_chunks(plaintext, 4);
    let cipherblocks =  new Array<BigUint64Array>(blocks.length);

    let iv = new BigUint64Array([0n, 0n, 0n, 0n]); // TODO: Create IV sharing scheme (If i forget this i am stupid)

    // First Term
    let working_array = xor_array(blocks[0], iv);
    cipherblocks[0] = encrypt_block(working_array, key) ;

    for (let i = 1; i < blocks.length; i++) {
        working_array = xor_array(blocks[i], cipherblocks[i - 1]);
        cipherblocks[i] = encrypt_block(working_array, key);
    }

    return cipherblocks.reduce(merge_uint64_array)
}

export function cbc_decrypt(ciphertext: BigUint64Array, key: RC6Key): BigUint64Array {
    let blocks = split_chunks(ciphertext, 4);
    let plainblocks = Array<BigUint64Array>(blocks.length);

    let iv = new BigUint64Array([0n, 0n, 0n, 0n]);
    let cipherblocks = [iv, ...blocks];
    let array = [...blocks].map( (x, i) => xor_array(decrypt_block(x, key), cipherblocks[i])).reduce(merge_uint64_array);
    return new BigUint64Array(array);
}

export function encrypt_message(message: string, key: RC6Key): string {
    let plaintext = new TextEncoder().encode(message)
    let paddLength = 8 - (plaintext.length % 8)
    let paddedArray = padd_typed_array(plaintext, plaintext.length + paddLength);
    let ciphertext = cbc_encrypt(new BigUint64Array(paddedArray.buffer), key)
    return uint8array_to_base64(new Uint8Array(ciphertext.buffer))
}

export function decrypt_message(message: string, key: RC6Key): string {
    let ciphertext = base64_to_uint8array(message);
    let plaintext = cbc_decrypt(new BigUint64Array(ciphertext.buffer), key)
    return new TextDecoder().decode(new Uint8Array(plaintext.buffer))
        .replace(/\0+$/g, "") // Removes trailing charcode 0s from padding process
}