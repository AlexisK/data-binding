export function cloneContext(ctx) {
    let copy = Object.assign({}, ctx);
    copy.__proto__ = ctx.__proto__;

    return copy;
}
