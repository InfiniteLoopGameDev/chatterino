function rotate_left(number: bigint, shifts: bigint, size: number) {
    shifts = shifts % BigInt(size)
    let mask = number >> (BigInt(size) - shifts)
    let top = number & ((1n << (BigInt(size) - shifts)) - 1n)
    top = top << shifts
    return top | mask
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
            B = bigIntKey[j];
            i = (i + 1) % (keyLength + 1);
            j = (j + 1) % input.length;
        }
    }
}