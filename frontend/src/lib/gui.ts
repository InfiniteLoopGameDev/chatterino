import * as utils from "$lib/utils"

export function password_prompt(): BigUint64Array{
    let password: string | null = "";
    let prompt_message = "Enter Safe Password";
    while (password === "") {
        password = prompt(prompt_message);
        prompt_message = "Empty passwords are not allowed\nEnter Safe Password";
    }
    if (password === null) {
        return new BigUint64Array()
    }
    let plaintext = new TextEncoder().encode(password)
    let paddLength = 8 - (plaintext.length % 8)
    let paddedArray = utils.padd_typed_array(plaintext, plaintext.length + paddLength);
    return new BigUint64Array(paddedArray.buffer)
}