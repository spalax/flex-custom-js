const {VM, VMScript} = require('vm2');
const userContext = {'ip': '185.128.156.162'};
const untrusted5 = `
    async function onRequest (request, response) {
	    Array.prototype.map = () => ({ customObject: true });
		return [ "myhost" + (request * response) + ".com" ];
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
    const promises = [];
    const codeToRun = new VMScript(untrusted5).wrap(
        '',
        wrapper
    ).compile();
    (async () => {
        for (let i = 0; i < 10000; i++) {
            context.request += i;
            await vm.run(codeToRun);
        }
        console.timeEnd("fast-solution");
    })();
}

async function blazingFast() {
    console.time("blazing-fast-solution");
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
    const codeToRun = new VMScript(untrusted5).wrap(
        '',
        wrapper
    ).compile();
    const promises = [];
    for (let i = 0; i < 10000; i++) {
        context.request += i;
        promises.push(vm.run(codeToRun));
    }
    Promise.all(promises).then(() => {
        console.timeEnd("blazing-fast-solution");
    })
}

async function currentSolution() {
    console.time("current-solution");
    const codeToRun = new VMScript(untrusted5).wrap(
        '',
        wrapper
    ).compile();
    for (let i = 0; i < 10000; i++) {
        const vm = new VM({
            wasm: false,
            console: 'inherit',
            eval: false,
            timeout: 1000,
            sandbox: {
                getRequest: () => 123 + i,
                getResponse: () => 2
            }
        });
        await vm.run(codeToRun);
    }
    console.timeEnd("current-solution");
}

(async () => {
    await currentSolution();
    await fast();
    await blazingFast();
})();
