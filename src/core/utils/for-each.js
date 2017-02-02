export function forEach(target, cb) {
    for (let k in target) {
        if ( target.hasOwnProperty(k) ) {
            cb(target[k], k);
        }
    }
}
