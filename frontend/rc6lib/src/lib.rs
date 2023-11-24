use std::usize;
use wasm_bindgen::prelude::*;

const P: u64 = 0xb7e151628aed2a6b;
const Q: u64 = 0x9e3779b97f4a7c15;
// const P: { [key: number]: bigint } = {16: 0xb7e1n, 32: 0xb7e15163n, 64: 0xb7e151628aed2a6bn}
// const Q: { [key: number]: bigint } = {16: 0x9e37n, 32: 0x9e3779b9n, 64: 0x9e3779b97f4a7c15n}

#[wasm_bindgen]
#[no_mangle]
pub fn keygen(input: &[u64], rounds: i32) -> Vec<u64> {
    let mut input_array = input.to_vec();
    let input_length = input.len();
    let key_length: u64 = 2 * rounds as u64 + 3;

    let mut s: Vec<u64> = vec![key_length];

    s[0] = P;

    for i in 1..(key_length as usize + 1) {
        s[i] = s[i-1] + Q;
    }

    let (mut a, mut b, mut i, mut j): (u64, u64, usize, usize) = (0, 0, 0, 0) ;

    let v = 3 * std::cmp::max(key_length + 1, input_length as u64);
    for _ in 0..v {
        a = u64::rotate_left(s[i] + a + b, 3);
        s[i] = a;
        b = u64::rotate_left(input_array[j] + a + b, (a + b) as u32);
        input_array[j] = b;
        i = (i + 1) % (key_length as usize + 1);
        j = (j + 1) % (input_length);
    }

    return s;
}


#[wasm_bindgen]
#[no_mangle]
pub fn encrypt_block(plaintext: &[u64], key: &[u64], rounds: i32) -> Box<[u64]> {
    let array = [plaintext[0], plaintext[1], plaintext[2], plaintext[3]];
    let word_length = u64::BITS;
    let lgw =  word_length.ilog2();
    let [mut a, mut b, mut c, mut d] = array;

    b += key[0];
    d += key[1];
    for i in 1..(rounds as usize + 1) {
        let t = u64::rotate_left(b * (2 * b + 1), lgw);
        let u = u64::rotate_left(d * (2 * d + 1), lgw);
        a = u64::rotate_left(a ^ t, u as u32) + key[2 * i];
        c = u64::rotate_left(c ^ u, t as u32 ) + key[2 * i + 1];
        [a, b, c, d] = [b, c, d, a]
    }
    a = a + key[2 * (rounds as usize) + 2];
    c = c + key[2 * (rounds as usize) + 3];

    return Box::new([a, b, c, d]);
}

#[wasm_bindgen]
#[no_mangle]
pub fn decrypt_block(ciphertext: &[u64], key: &[u64], rounds: i32) -> Box<[u64]> {
    let array = [ciphertext[0], ciphertext[1], ciphertext[2], ciphertext[3]];
    let word_length = u64::BITS;
    let lgw = word_length.ilog2(); // word_length - word_length.leading_zeros();
    let [mut a, mut b, mut c, mut d] = array;

    c = c - key[2 * (rounds as usize) + 3];
    a = a - key[2 * (rounds as usize) + 2];
    for i in (1..(rounds as usize + 1)).rev() {
        [a, b, c, d] = [d, a, b, c];
        let u = u64::rotate_left(d * (2 * d + 1), lgw);
        let t = u64::rotate_left(b * (2 * b + 1), lgw);
        c = u64::rotate_right(c  - key[2 * i + 1], t as u32) ^ u;
        a = u64::rotate_right(a - key[2 * i], u as u32) ^ t;
    }
    d = d - key[1];
    b = b - key[0];

    return Box::new([a, b, c, d]);
}