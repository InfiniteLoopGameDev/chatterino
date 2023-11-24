import * as wasm from "rc6lib"
import {rotate_left, rotate_right, split_chunks, xor_array} from "./utils";

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
    S: bigint[]; // Round Keys
    descriptor: RC6Descriptor;
    modulo: bigint;

    constructor(input: bigint[], descriptor: RC6Descriptor) {
        this.descriptor = descriptor;
        let keyLength = 2 * descriptor.rounds + 3;
        this.modulo = 1n << BigInt(descriptor.wordLength);
        let fill = Array<bigint>(this.descriptor.keySize - input.length).fill(0n);
        let bigIntKey = Array.from([...input, ...fill]);

        this.S = new Array<bigint>(keyLength + 1);

        this.S[0] = P[descriptor.wordLength];

        for (let i = 1; i <= keyLength; i++) {
            this.S[i] = (this.S[i-1] + Q[descriptor.wordLength]) % this.modulo;
        }

        let A = 0n, B = 0n, i = 0, j = 0;

        let v = 3 * Math.max(keyLength + 1, bigIntKey.length);
        for (let s = 0; s < v; s++) {
            A = this.S[i] = rotate_left((this.S[i] + A + B) % this.modulo, 3n, descriptor.wordLength);
            B = bigIntKey[j] = rotate_left((bigIntKey[j] + A + B) % this.modulo, (A + B) % this.modulo, descriptor.wordLength);
            i = ((i + 1) % keyLength + 1);
            j = (j + 1) % input.length;
        }
    }
}

export function encrypt_block(plaintext: BigUint64Array, key: RC6Key): BigUint64Array {
    return wasm.encrypt_block(plaintext, key.S, key.descriptor.rounds);
}

export function decrypt_block(ciphertext: BigUint64Array, key: RC6Key): BigUint64Array {
    return wasm.decrypt_block(ciphertext, key.S, key.descriptor.rounds)
}

export function cbc_encrypt(plaintext: BigUint64Array, key: RC6Key): bigint[] {
    plaintext.fill(0n, -1, -(plaintext.length % 4));
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

    return cipherblocks.reduce((a, b) => [...a, ...b], [])
}

export function cbc_decrypt(ciphertext: bigint[], key: RC6Key): bigint[] {
    let blocks = split_chunks(ciphertext, 4);
    let plainblocks = Array<Array<bigint>>(blocks.length);

    let iv = [0n, 0n, 0n, 0n];
    let cipherblocks = [iv, ...blocks];

    return [...blocks].map( (x, i) => xor_array(decrypt_block(x, key), cipherblocks[i])).flat()
}