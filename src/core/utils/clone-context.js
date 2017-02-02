export function cloneContext(ctx) {
    let copy = new Object();
    copy.__proto__ = ctx;

    return copy;
}
