const ts     = 10;
const queue  = [];
let interval = null;

function runWorker() {
    if ( queue.length ) {
        queue.forEach(func => func());
        interval = setTimeout(runWorker, ts);
    }
}

export function subscribeEventLoopUpdate(func) {
    queue.push(func);
    runWorker();
}