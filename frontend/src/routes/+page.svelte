<script lang="ts">
    import {generate_key_pair, rsa_decrypt, rsa_encrypt, encrypt_message, decrypt_message} from "$lib/encryption";
            
    let en_input: bigint = 255n;
    let de_input: bigint = 6876675n;

    let keys = generate_key_pair(2048);
    let public_key = keys[0];
    let private_key = keys[1];

    let encrypted = encrypt_message("will is short", public_key);
    let decrypted = decrypt_message(encrypted, private_key);
    console.log(encrypted);
    console.log(decrypted);

    $: en_output = rsa_encrypt(BigInt(en_input), public_key.e, public_key.n);
    $: de_output = rsa_decrypt(BigInt(de_input), private_key.d, private_key.n);
</script>


<h1>Options</h1>
<h1>Encryption</h1>
<input bind:value={en_input}>
<p>{en_output}</p>
<h1>Decryption</h1>
<input bind:value={de_input}>
<p>{de_output}</p>
<h1>Keys</h1>
<p>Private: [{private_key.n},{private_key.d}]</p>
<p>Public: [{public_key.n},{public_key.e}]</p>