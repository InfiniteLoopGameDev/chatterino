<script lang="ts">
    import * as encrypt from "$lib/rsa";
    import { key_export, key_import } from "$lib/utils";
    import * as rc6 from "$lib/rc6";
    import * as vsh from "$lib/vsh"
      
    let en_input: string = "Hello World";
    let de_input: string = "S74GBCpAjmzjDQOKcgFe6I7j43Vwjwez3KSAjSweQVg=";

    let public_key_import: string;
    let private_key_import: string;
    let encrypt_key_import: string;

    const default_n = 86418891819187277695323277220422635771372010987764722610921129897330728349497n;
    let key_size: number = 2048;
    let max_length = key_size / 8;

    let public_key = new encrypt.PublicKey(default_n, 65537n);
    let private_key = new encrypt.PrivateKey(default_n, 30025148644626612648160749230343522231334675156539329375652001692597546836873n);
    let encrypt_key = new encrypt.PublicKey(default_n, 65537n);

    function key_gen() {
        let keys = encrypt.generate_key_pair(key_size);
        public_key = keys[0];
        private_key = keys[1];
    }

    function import_keys() {
        // @ts-ignore As long as user doens't switch things around, this should be fine (Trust me bro)
        public_key = key_import(public_key_import);
        // @ts-ignore 
        private_key = key_import(private_key_import);
        // @ts-ignore
        encrypt_key = key_import(encrypt_key_import);
    }

    $: en_output = encrypt.encrypt_message(en_input, encrypt_key)
    $: de_output = encrypt.decrypt_message(de_input, private_key)

    $: public_key_export = key_export(public_key);
    $: encrypt_key_export = key_export(encrypt_key);
    $: private_key_export = key_export(private_key);

    let rc6descript = new rc6.RC6Descriptor(64, 14, 16)
    let rc6key = new rc6.RC6Key(new BigUint64Array([25n, 44n, 48n, 6611n]), rc6descript);
    let rc6message = "Hello World";
    let rc6cipher = rc6.encrypt_message(rc6message, rc6key)
    console.log(rc6cipher);
    console.log(rc6.decrypt_message(rc6cipher, rc6key));

    console.log(vsh.hash_string("Hi Bob!"))
</script>


<h1>Options</h1>
<h1>Encryption</h1>
<input bind:value={en_input}>
<p>{en_output}</p>
<h1>Decryption</h1>
<input bind:value={de_input}>
<p>{de_output}</p>
<h1>Keys</h1>
<p>Private: <input bind:value={private_key.n}>,<input bind:value={private_key.d}></p>
<p>Public: <input bind:value={public_key.n}>,<input bind:value={public_key.e}></p>
<button on:click={key_gen}>Generate Key <input type="number" bind:value={key_size}></button>
<br>
<h1>Export Keys</h1>
Your Keys:
<p>Public key: <textarea bind:value={public_key_export} rows="4" cols="55"></textarea></p>
<p>Private key: <textarea bind:value={private_key_export} rows="4" cols="55"></textarea></p>
Others key:
<p>Public key: <textarea bind:value={encrypt_key_export} rows="4" cols="55"></textarea></p>
<h1>Import Keys</h1>
Your Keys:
<p>Public key: <textarea bind:value={public_key_import} rows="4" cols="55"></textarea></p>
<p>Private key: <textarea bind:value={private_key_import} rows="4" cols="55"></textarea></p>
Others key:
<p>Public key: <textarea bind:value={encrypt_key_import} rows="4" cols="55"></textarea></p>
<button on:click={import_keys}>Import</button>
