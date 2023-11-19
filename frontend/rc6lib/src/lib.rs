use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
#[no_mangle]
pub fn greet(name: &str) {
    log(&format!("Hello, {}!", name));
}

