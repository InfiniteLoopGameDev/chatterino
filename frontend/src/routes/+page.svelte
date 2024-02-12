<script lang="ts">
    import * as rsa from "$lib/rsa";
    import * as gui from "$lib/gui";
    import { key_export, key_import } from "$lib/utils";
    import * as rc6 from "$lib/rc6";
    import * as utils from "$lib/utils"
    import * as vsh from "$lib/vsh";

    const global_rc6_descriptor = new rc6.RC6Descriptor(64, 14, 16)

    let session_keys: {name: string, key: rc6.RC6Key}[] = [];

    let own_public_key: rsa.PublicKey;
    let other_public_key: rsa.PublicKey;

    let private_key: rsa.PrivateKey = new rsa.PrivateKey(0n, 0n);

    function load_keys() {
        let password = gui.password_prompt();
        let encrypt_key = new rc6.RC6Key(password, global_rc6_descriptor);
        let key_hash = vsh.hash_uint_array(password);
        
        if (key_hash != window.localStorage.getItem("key_hash")) {
            alert("Incorrect Passkey");
            return
        }

        let fetch = window.localStorage.getItem("encrypted_keys");
        if (fetch === null) {
            alert("Unable to retrieve keys");
            return
        }
        let encrypted_keys: {name: string, S: [], descriptor: rc6.RC6Descriptor}[] = JSON.parse(fetch);

        encrypted_keys.forEach(element => {
            let name = rc6.decrypt_message(element.name, encrypt_key);
            let encrypted_S = utils.object_to_uintarray(element.S)
            let S = rc6.cbc_decrypt(new BigUint64Array(encrypted_S.buffer), encrypt_key);

            session_keys.push({name: name, key: {S: S, descriptor: element.descriptor}});
        })

        fetch = window.localStorage.getItem("private_key");
        if (fetch === null) {
            alert("Unable to retrieve keys");
            return
        }
        let cipher_private_key = JSON.parse(fetch);

        let cipher = new Uint32Array(cipher_private_key.d);
        let ciphertext = rc6.cbc_decrypt(new BigUint64Array(cipher.buffer), encrypt_key);
        let plaintext = new Uint8Array(ciphertext.buffer);
        plaintext = plaintext.slice(0, plaintext.findIndex((v, i) => {return (v === 0 && plaintext[i+1] === 0)}));
        private_key.d = utils.uint8array_to_bigint(plaintext);
        
        cipher = new Uint32Array(cipher_private_key.n);
        ciphertext = rc6.cbc_decrypt(new BigUint64Array(cipher.buffer), encrypt_key);
        plaintext = new Uint8Array(ciphertext.buffer);
        plaintext = plaintext.slice(0, plaintext.findIndex((v, i) => {return (v === 0 && plaintext[i+1] === 0)}));
        private_key.n = utils.uint8array_to_bigint(new Uint8Array(plaintext));

        console.log(private_key);
        console.log(session_keys);
    }

    function save_keys() {
        console.log(private_key);
        console.log(session_keys);

        let password = gui.password_prompt();
        let encrypt_key = new rc6.RC6Key(password, global_rc6_descriptor);
        let key_hash = vsh.hash_uint_array(password);
        
        window.localStorage.setItem("key_hash", key_hash);
        
        let encrypted_keys: {name: string, S: Uint32Array, descriptor: rc6.RC6Descriptor}[] = [];

        session_keys.forEach(element => {
            let cipher_name = rc6.encrypt_message(element.name, encrypt_key);
            let cipher_S = rc6.cbc_encrypt(element.key.S, encrypt_key).buffer;

            encrypted_keys.push({name: cipher_name, S: new Uint32Array(cipher_S), descriptor: element.key.descriptor})
        });

        window.localStorage.setItem("encrypted_keys", JSON.stringify(encrypted_keys))

        let plaintext = utils.bigint_to_uint8array(private_key.d);
        plaintext = utils.padd_typed_array(plaintext, plaintext.length + 8 - (plaintext.length % 8));
        let cipher = rc6.cbc_encrypt(new BigUint64Array(plaintext.buffer), encrypt_key);
        let cipher_d: number[] = [];
        new Uint32Array(cipher.buffer).forEach((v, i) => {cipher_d[i] = v});

        plaintext = utils.bigint_to_uint8array(private_key.n);
        plaintext = utils.padd_typed_array(plaintext, plaintext.length + 8 - (plaintext.length % 8));
        cipher = rc6.cbc_encrypt(new BigUint64Array(plaintext.buffer), encrypt_key);
        let cipher_n: number[] = [];
        new Uint32Array(cipher.buffer).forEach((v, i) => {cipher_n[i] = v});

        let cipher_private_key = {d: cipher_d, n: cipher_n};

        window.localStorage.setItem("private_key", JSON.stringify(cipher_private_key))
    }

    let key_size: number = 256;
    let max_length = key_size / 8;

    function generate_random_rc6_key(): rc6.RC6Key {
        let rc6descript = new rc6.RC6Descriptor(64, 14, 16);
        let length = (2 * rc6descript.rounds + 3) + 8 - (2 * rc6descript.rounds + 3) % 8
        let buffer = new ArrayBuffer(length)
        let randomVals = new BigUint64Array(buffer);
        crypto.getRandomValues(randomVals);
        let key = new rc6.RC6Key(randomVals, rc6descript)
        return key;
    }

    [own_public_key, private_key] = rsa.generate_key_pair(key_size);

    session_keys.push({name: "test", key: generate_random_rc6_key()});

    console.log("Keygen Finished")


    function output_encrypted() {

    }

    function output_decrypted() {
        
    }

    function rc6keygen() {
        let name = prompt("Enter Key Name");
        if (name === null) { name = "" };
        let rsa_public = prompt("Enter Public Key of Recipient")
        let key = generate_random_rc6_key();
        session_keys.push({name: name, key: key});
        rsa.encrypt_message(JSON.stringify(key), rsa_public);
    }

    let isDropdownMenuOpen = false

    function handleDropdownClick() {
        isDropdownMenuOpen = !isDropdownMenuOpen
    }

    type DivFocusEvent = FocusEvent & { currentTarget: HTMLDivElement };
    function handleDropdownMenuFocusLoss({ relatedTarget, currentTarget }: DivFocusEvent) {
        if (relatedTarget instanceof HTMLElement && currentTarget.contains(relatedTarget)) return
        isDropdownMenuOpen = false
    }

    function handleDropdownMenuFocusGain() {
        isDropdownMenuOpen = true
    }
</script>

<div on:focusout={handleDropdownMenuFocusLoss}>
    <input on:focusin={handleDropdownMenuFocusGain}> <button on:click={handleDropdownClick}> > </button>
    <ul style:visibility={isDropdownMenuOpen ? 'visible' : 'hidden'}>
        <button on:click={rc6keygen}>New Key</button>
    </ul>

    <button on:click={save_keys}>Save keys</button>
    <button on:click={load_keys}>Load keys</button>
</div>
<textarea on:change={output_decrypted}></textarea>