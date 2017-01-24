const CHECK = {
    eval         : ['with(this) { return (', '); }'],
    reUpdateVars : /@update\(([\s\w\d,\-_]+)\);?/gi
};

let __updateInterval = null;

export function evalExpression(ctx, expr) {
    try {
        let newExpr = expr.replace(CHECK.reUpdateVars, (match, updates) => {
            clearInterval(__updateInterval);
            __updateInterval = setTimeout(() => {
                ctx.__component.updateByVars(updates.split(/\s+,\s*/g));
            }, 1);
            return '';
        });

        return (new Function(CHECK.eval.join(newExpr))).call(ctx);
    } catch (err) {
        console.groupCollapsed('DATA_BIND: [Evaluating expression failed]');
        console.warn(err,
            '\n\n$event:\n', ctx['$event'],
            '\n\nContext:\n', ctx,
            '\n\nExpression:\n', expr);
        console.groupEnd();
        return CHECK.errorParsing;
    }
}