const CHECK = {
    eval              : ['with(this) { return (', '); }']
};

export function evalExpression(ctx, expr) {
    try {
        return (new Function(CHECK.eval.join(expr))).call(ctx);
    } catch (err) {
        console.warn('DATA_BIND: [Evaluating expression failed]\n\n', err);
        return CHECK.errorParsing;
    }
}