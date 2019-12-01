const {VM} = require('vm2');
const userContext = {'ip': '185.128.156.162'};

const vm = new VM({
    console: false,
    eval: false,
    timeout: 1000,
    sandbox: userContext
});

const untrusted = `
function onRequest () {
	return {
		get addr () {
			let array = [];
			while (true) { array.push(Buffer.alloc(1e7, 'x')) }
		},
	};
}
`;

const untrusted2 = `
		function main(){
		while(1){}
	}
	new Proxy({}, {
		getPrototypeOf(t){
			global.main();
		}
	})
`;

const untrusted3 = `
  while(true);
`

try{
	console.log(vm.run(untrusted));
}catch(x){
	console.log(x);
}

try{
	console.log(vm.run(untrusted2));
}catch(x){
	console.log(x);
}

try{
	console.log(vm.run(untrusted3));
}catch(x){
	console.log(x);
}
