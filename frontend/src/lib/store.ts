import type * as rc6 from "./rc6"

class SessionKeyStore extends Array<{name: string, key: rc6.RC6Key}> {
    constructor(items: Array<{name: string, key: rc6.RC6Key}>) {
        super(items);
    }

    function store() {

    }
}