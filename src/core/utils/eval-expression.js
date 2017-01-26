import { logWarning, logException } from "./log-exception";
const CHECK = {
    eval         : ['with(this) { return (', '); }'],
    errorParsing : '{{ERR}}',
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
        logException('Evaluating expression failed', {
            '$event' : ctx['$event'],
            ctx, expr
        });
        return CHECK.errorParsing;
    }
}