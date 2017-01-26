export function logException(title, data) {
    console.groupCollapsed(['EXCEPTION:\t', ''].join(title));

    Object.keys(data).forEach(key => {
        console.log(key, '\n', data[key], '\n')
    });

    console.groupEnd();
}
export function logWarning(title, data) {
    //console.groupCollapsed(['WARNING:\t', ''].join(title));
    //
    //Object.keys(data).forEach(key => {
    //    console.log(key, '\n', data[key], '\n')
    //});
    //
    //console.groupEnd();
}
