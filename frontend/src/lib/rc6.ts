function rotate_left(number: bigint, shifts: bigint, size: number) {
    shifts = shifts % BigInt(size);
    let mask = number >> (BigInt(size) - shifts);
    let top = number & ((1n << (BigInt(size) - shifts)) - 1n);
    top = top << shifts;
    return top | mask;
}

function rotate_right(number: bigint, shifts: bigint, size: number) {
    shifts = shifts % BigInt(size);
    let mask = number >> shifts;
    let top = number & ((1n << shifts) - 1n);
    top = top << (BigInt(size) - shifts);
    return top | mask;
}

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
    S: bigint[];
    descriptor: RC6Descriptor;
    modulo: bigint;

    constructor(input: Uint8Array, descriptor: RC6Descriptor) {
        this.descriptor = descriptor;
        let keyLength = 2 * descriptor.rounds + 3;
        this.modulo = 1n << BigInt(descriptor.wordLength);
        let bigIntKey = Array.from(input).map(BigInt);

        this.S = new Array<bigint>(keyLength + 1);

        this.S[0] = P[descriptor.wordLength];

        for (let i = 1; i <= keyLength; i++) {
            this.S[i] = (this.S[i-1] + Q[descriptor.wordLength]) % this.modulo;
        }

        let A = 0n, B = 0n, i = 0, j = 0;

        let v = 3 * Math.max(keyLength + 1, input.length);
        for (let s = 1; s <= v; s++) {
            this.S[i] = rotate_left((this.S[i] + A + B) % this.modulo, 3n, descriptor.wordLength);
            A = this.S[i];
            bigIntKey[j] = rotate_left((BigInt(bigIntKey[j]) + A + B) % this.modulo, A + B, descriptor.wordLength);
            B = bigIntKey[j]
            i = (i + 1) % (keyLength + 1);
            j = (j + 1) % input.length;
        }
    }
}

function rc6_encrypt(plaintext: bigint[], key: RC6Key): bigint[] {
    let wordLength = key.descriptor.wordLength;
    let rounds = key.descriptor.rounds;
    let lgw = BigInt(Math.log2(wordLength));
    let [A, B, C, D] = plaintext;

    B = B + key.S[0];
    D = D + key.S[1];
    for (let i = 1; i < rounds; i++) {
        let t = rotate_left(B * (2n * B + 1n), lgw, wordLength);
        let u = rotate_left(D * (2n * D + 1n), lgw, wordLength);
        A = rotate_left(A ^ t, u, wordLength) + key.S[2 * i];
        C = rotate_left(C ^ u, t, wordLength) + key.S[2 * i + 1];
        [A, B, C, D] = [B, C, D, A]
    }
    A = A + key.S[2 * rounds + 2];
    C = C + key.S[2 * rounds + 3];

    return [A, B, C, D];
}

function rc6_decrypt(ciphertext: bigint[], key: RC6Key): bigint[] {
    let wordLength = key.descriptor.wordLength;
    let rounds = key.descriptor.rounds;
    let lgw = BigInt(Math.log2(wordLength));
    let [A, B, C, D] = ciphertext;

    C = C - key.S[2 * rounds + 3];
    A = A - key.S[2 * rounds + 2];
    for (let i = 1; i < rounds; i++) {
        [A, B, C, D] = [D, A, B, C]
        let u = rotate_left(D * (2n * D + 1n), lgw, wordLength);
        let t = rotate_left(B * (2n * B + 1n), lgw, wordLength);
        A = rotate_left(A ^ t, u, wordLength) + key.S[2 * i];
        C = rotate_left(C ^ u, t, wordLength) + key.S[2 * i + 1];
    }
    D = D - key.S[1];
    B = B - key.S[0];

    return [A, B, C, D];
}