const {VM, VMScript} = require('vm2');
const userContext = {'ip': '185.128.156.162'};

const untrusted5 = `
	async function onRequest (request, response) {
		return ["myhost" + (request * response) + ".com"];
	}
`;

const wrapper = `
    'use strict';
    
    (async () => {
		const res = await onRequest(global.getRequest(), global.getResponse());
		if (Array.isArray(res)) {
			return res.filter((item) => (typeof item === 'string')).map((item) => ("" + item));
		} else if (typeof res === 'string') {
			return ("" + res);
		} else {
		   return false;
		}
    })();
`;

async function fast() {
    console.time("fast-solution");
    const context = {request: 123, response: 2};
    const sandbox = {
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
    (async () => {
        console.log(await vm.run(codeToRun));
    })();
}

(async () => {
    await fast();
})();
