
export function iterateDom(parent, callback) {
    let children = Array.from(parent.childNodes).filter(el => el.nodeType === 1);
    children.forEach(child => {
        iterateDom(child, callback);
        callback(child, parent);
    });
}
