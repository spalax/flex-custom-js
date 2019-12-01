const {VM, VMScript} = require('vm2');
const userContext = {'ip': '185.128.156.162'};

const untrusted5 = `
	async function onRequest (request, response) {
        return [new A("myhost" + (request * response) + ".com")];
    }
`;

const wrapper = `
    'use strict';

    (async () => {
		const res = await onRequest(global.getRequest(), global.getResponse());
		if (Array.isArray(res)) {
			return res.join('|');
		} else if (typeof res === 'string') {
			return "" + res;
		} else {
		   return "";
		}
    })();
`;

async function fast() {
    console.time("fast-solution");
    const context = {request: 123, response: 2};
    const sandbox = {
        String: null,
        getRequest: () => {
            return context.request
        }, getResponse: () => {
            return context.response
        }
    };

    const vm = new VM({
        wasm: false,
        console: 'inherit',
        eval: false,
        timeout: 1000,
        sandbox: sandbox
    });
    vm.freeze(sandbox, 'sandbox');
    const codeToRun = new VMScript(untrusted5).wrap(
        '',
        wrapper
    ).compile();
    return (async () => {
        const result = await vm.run(codeToRun);
        if (typeof result !== "string" ||
            result instanceof String) {
            return 'fallback';
        }

        return result.split('|');
    })();
}

(async () => {
    console.log(await fast());
})();
