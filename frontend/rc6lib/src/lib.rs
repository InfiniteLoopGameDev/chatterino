use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[no_mangle]
pub fn encrypt_block(plaintext: &[u32], key: &[u32], rounds: i32) -> Box<[u32]> {
    let array = [plaintext[0], plaintext[1], plaintext[2], plaintext[3]];
    let word_length = u32::BITS;
    let lgw =  5; //word_length - word_length.leading_zeros();
    let [mut A, mut B, mut C, mut D] = array;

    B += key[0];
    D += key[1];
    for i in 1..(rounds as usize + 1) {
        let t = u32::rotate_left(B * (2 * B + 1), lgw);
        let u = u32::rotate_left(D * (2 * D + 1), lgw);
        A = u32::rotate_left(A ^ t, u) + key[2 * i];
        C = u32::rotate_left(C ^ u, t) + key[2 * i + 1];
        [A, B, C, D] = [B, C, D, A]
    }
    A = A + key[2 * (rounds as usize) + 2];
    C = C + key[2 * (rounds as usize) + 3];

    return Box::new([A, B, C, D]);
}

#[wasm_bindgen]
#[no_mangle]
pub fn decrypt_block(ciphertext: &[u32], key: &[u32], rounds: i32) -> Box<[u32]> {
    let array = [ciphertext[0], ciphertext[1], ciphertext[2], ciphertext[3]];
    let word_length = u32::BITS;
    let lgw = word_length.ilog2(); // word_length - word_length.leading_zeros();
    let [mut A, mut B, mut C, mut D] = array;

    C = C - key[2 * (rounds as usize) + 3];
    A = A - key[2 * (rounds as usize) + 2];
    for i in (1..(rounds as usize + 1)).rev() {
        [A, B, C, D] = [D, A, B, C];
        let u = u32::rotate_left(D * (2 * D + 1), lgw);
        let t = u32::rotate_left(B * (2 * B + 1), lgw);
        C = u32::rotate_right(C  - key[2 * i + 1], t) ^ u;
        A = u32::rotate_right(A - key[2 * i], u) ^ t;
    }
    D = D - key[1];
    B = B - key[0];

    return Box::new([A, B, C, D]);
}