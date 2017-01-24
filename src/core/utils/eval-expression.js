const CHECK = {
    eval              : ['with(this) { return (', '); }']
};

export function evalExpression(ctx, expr) {
    try {
        return (new Function(CHECK.eval.join(expr))).call(ctx);
    } catch (err) {
        console.warn('DATA_BIND: [Evaluating expression failed]\n\n',err,
            '\n\n$event:\n', ctx['$event'],
            '\n\nContext:\n', ctx,
            '\n\nExpression:\n', expr);
        return CHECK.errorParsing;
    }
}