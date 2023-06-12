import {message_encode, message_decode} from "./utils";

const big_abs = (n: bigint) => (n < 0n) ? -n : n; // Absolute value function for bigints
const big_max = (a: bigint, b: bigint) => (a > b) ? a : b; // Largest value function for bigints

function rand_bytes(size: number) {
    let buffer = new ArrayBuffer(size); // Create a buffer of the correct size
    let array = new BigUint64Array(buffer); 
    crypto.getRandomValues(array); // Fill the buffer with random values
    return array.join(""); // Join the values into a string
}

// Miller–Rabin primality test
// TODO: run multiple times with input k to increase accuracy
function probable_prime(n: bigint): boolean {
    if (n === 2n || n === 3n) return true // Doesn't work for 2 or 3
    if (n % 2n === 0n || n < 2n) return false // Even numbers are not prime, don't check numbers less than 2

    // Find s and d where n - 1 = 2^s * d
    let s = 0n
    let d = n - 1n
    while ((d & 1n) == 0n) { // d needs to be odd
        d >>= 1n
        ++s
    }

    let base = 2n // TODO: Generate random base between 2 and n - 1
    let x = modular_exponentiation(base, d, n);

    if (x == 1n || x == n - 1n) return true

    for (let i = 0; i < (s - 1n); i++) {
        x = (x * x) % n

        if (x === 1n) return false
        if (x === n - 1n) return true
    }
    return false
}

function rand_prime(size: number) {
    let rand_size = size / 8 // Size in bytes 
    let rand = BigInt(rand_bytes(rand_size));
    rand |= BigInt(1 << (size - 1)); // Set the most significant bit (Used to ensure the number is the correct size)
    rand |= 1n; // Set the least significant bit (Used to ensure the number is odd (even numbers are not prime)))
    console.log("Generating random prime...");
    while (!probable_prime(rand)) { // Generate random numbers until a prime is found
        rand = BigInt(rand_bytes(rand_size));
    }
    return rand;
}

// Euclid's algorithm for greatest common divisor
function gcd(a: bigint, b: bigint) {
    while (b != 0n) {
        let temp: bigint = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// Extended Euclidian algorithm (a and b must be coprime)
function mod_inverse(a: bigint, m: bigint) {
    let m0 = m; // Store initial value of m for later use
    let y = 0n;
    let x = 1n;

    if (m == 1n) return 0n; // No inverse if m is 1

    while (a > 1n)
    {
        let q = a / m; // Quotient
        let t = m; // Temporary variable
        m = a % m;
        a = t;
        t = y;
        y = x - q * y;
        x = t;
    }

    // Make x positive
    if (x < 0n)
        x += m0;

    return x;
}

// Carmichael's totient function
function totient(p: bigint, q: bigint) {
    // λ(n) = lcm(p − 1, q − 1) where p and q are prime and n = p * q
    let a = p - 1n;
    let b = q - 1n;

    // lcm(a, b) = |a * b| / gcd(a, b)
    let numerator = big_abs(a * b);
    let denominator = gcd(a, b);

    return numerator / denominator;
}

function e_calculation(lambda: bigint, extra: {prime_size: number, p: bigint, q: bigint}) {
    // List of common e values
    const e_list = [65537, 257, 17, 5];

    for (const item of e_list) { // Loop through the list of e values
        if (gcd(BigInt(item), lambda) == 1n) { // Check if the e value is coprime with lambda
            return BigInt(item);
        }
    }

    let max = big_max(extra.p, extra.q); // Find the largest prime
    let prime = rand_prime(extra.prime_size);
    while (prime < max) { // Generate random primes until one is larger than the largest prime
        prime = rand_prime(extra.prime_size); 
    }
    return prime;
}

function d_calculation(e: bigint, lambda: bigint) {
    return mod_inverse(e, lambda);
}

function modular_exponentiation(base: bigint, exponent: bigint, modulus: bigint) {
    if (modulus === 1n) {
        return 0n;
    }
    let result = 1n;
    base = base % modulus;
    while (exponent > 0) {
        if (exponent % 2n == 1n) {
            result = (result * base) % modulus;
        }
        exponent = exponent >> 1n;
        base = (base ** 2n) % modulus
    }
    return result
}

export class PublicKey {
    n: bigint;
    e: bigint;

    constructor(n: bigint, e: bigint) {
        this.n = n;
        this.e = e;
    }
}

export class PrivateKey {
    n: bigint;
    d: bigint;

    constructor(n: bigint, d: bigint) {
        this.n = n;
        this.d = d;
    }
}

export function rsa_encrypt(m: bigint, key: PublicKey) {
    return modular_exponentiation(m, key.e, key.n)
}

export function rsa_decrypt(c: bigint, key: PrivateKey) {
    return modular_exponentiation(c, key.d, key.n)
}


export function generate_key_pair(size: number): [PublicKey, PrivateKey]{
    let prime_size = size / 2;
    let p = rand_prime(prime_size);
    let q = rand_prime(prime_size);
    
    let n = p * q;
    let lambda = totient(p, q);
    let e = e_calculation(lambda, {prime_size, p, q});
    let public_key = new PublicKey(n, e);

    let d = d_calculation(e, lambda);
    let private_key = new PrivateKey(n, d);

    return [public_key, private_key];
}

export function encrypt_message(message: string, public_key: PublicKey) {
    let input_chars = new TextEncoder().encode(message); // Convert the message to an array of numbers
    let num_string = ""
    input_chars.forEach((value) => { // Convert the array of numbers to a string
        num_string += value.toString().padStart(3, "0"); // Pad each number to 3 digits
    });
    let plaintext = BigInt(num_string); // Convert the string to a bigint
    let ciphertext = rsa_encrypt(plaintext, public_key);
    return message_encode(ciphertext);
}

export function decrypt_message(message: string, private_key: PrivateKey) {
    let ciphertext = message_decode(message);
    let plainint = rsa_decrypt(BigInt(ciphertext), private_key);
    let plainsting = plainint.toString(); 
    while (plainsting.length % 3 != 0) { // Check if the decoded message is missing leading 0s
        plainsting = "0" + plainsting; // Pad the string with 0s until it is a multiple of 3
    }
    let plaintext = plainsting.match(/.{1,3}/g) // Split the string into an array of 3 digit strings
    if (plaintext === null) throw new Error("Invalid ciphertext");
    let output_chars = plaintext.map((value) => parseInt(value)) // Convert the array of 3 digit string to an array of numbers
    return new TextDecoder().decode(new Uint8Array(output_chars)); // Convert the array of numbers to a string
}