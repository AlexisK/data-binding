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


//                                                               //
//                    E X P E R I M E N T A L                    //
//                                                               //
//TODO: move expression breaking to webpack loader               //

const G = {
    reSpace      : /\s/,
    reNotSpace   : /\S/,
    reOperator   : /[\+\-\/\*\%]/,
    reExpr       : /[\w\d\.]/i,
    reScopeOpen  : /\(/,
    reScopeClose : /\)/,
    reQuote      : /'/,
    reBSlash     : /\\/
};

const TYPE = {
    string     : 1,
    operator   : 2,
    expression : 3,
    scope      : 4,
    number     : 5
};

// Work by index
function handleItem(ctx, pair) {
    if ( !pair ) { return null; }
    if ( pair[0] === TYPE.scope ) {
        return handleWork(ctx, pair[1]);
    } else if ( pair[0] === TYPE.string ) {
        return pair[1];
    } else if ( pair[0] === TYPE.number ) {
        return parseFloat(pair[1]);
    } else if ( pair[0] === TYPE.expression ) {
        return ctx[pair[1]];
    }
    return null;
}

// Build work & index jumps
function handleWork(ctx, workMap) {
    let result = [];

    for (let i = 0; i < workMap.length; i++) {
        let pair = workMap[i];

        let handled = handleItem(ctx, pair);
        if ( handled ) {
            result.push(handled);
        } else {
            if ( pair[0] === TYPE.operator ) {
                let leftOperand = result.pop();
                i++;

                if ( pair[1] === '+' ) {
                    result.push(leftOperand + handleItem(ctx, workMap[i]));
                } else if ( pair[1] === '-' ) {
                    result.push(leftOperand - handleItem(ctx, workMap[i]));
                } else if ( pair[1] === '*' ) {
                    result.push(leftOperand * handleItem(ctx, workMap[i]));
                } else if ( pair[1] === '/' ) {
                    result.push(leftOperand / handleItem(ctx, workMap[i]));
                } else if ( pair[1] === '%' ) {
                    result.push(leftOperand % handleItem(ctx, workMap[i]));
                }
            }
        }

    }
    console.log(result);
    return result;
}

function breakExpression(expr, startIndex = 0) {
    let workMap         = [];
    let isString        = false;
    let stringBuffer    = null;
    let isStringEscaped = false;
    let isExpression    = false;
    let exportIndex     = 0;


    let c, prevC;

    for (let i = startIndex; i < expr.length; i++, exportIndex++) {
        c = expr[i];

        //console.log(c);
        if ( isString ) {
            // check escaping in process
            if ( isStringEscaped ) {
                stringBuffer.push(c);
                isStringEscaped = false;
            } else {
                // check escape start
                if ( G.reBSlash.test(c) ) {
                    isStringEscaped = true;
                } else {
                    // check string end
                    if ( G.reQuote.test(c) ) {
                        workMap.push([TYPE.string, stringBuffer.join('')]);
                        isString = false;
                    } else {
                        // writing
                        stringBuffer.push(c);
                    }
                }
            }
        } else {
            // check string starts
            if ( G.reQuote.test(c) ) {
                stringBuffer = [];
                isString     = true;
            } else {
                // checkWritingExpression
                if ( isExpression ) {
                    if ( !G.reExpr.test(c) ) {
                        let expr = stringBuffer.join('');
                        workMap.push([isNaN(expr) && TYPE.expression || TYPE.number, expr]);
                        isExpression = false;
                    } else {
                        stringBuffer.push(c);
                    }
                }
                // isExpression may change
                if ( !isExpression ) {

                    if ( G.reScopeClose.test(c) ) {
                        exportIndex++;
                        break;
                    } else if ( G.reScopeOpen.test(c) ) {
                        let scopeExpression = breakExpression(expr, i + 1);
                        i += scopeExpression.exportIndex + 1;
                        exportIndex += scopeExpression.exportIndex + 1;
                        workMap.push([TYPE.scope, scopeExpression.workMap]);
                    } else

                    // check operator
                    if ( G.reOperator.test(c) ) {
                        workMap.push([TYPE.operator, c]);
                    } else {
                        // chack expr starts
                        if ( G.reExpr.test(c) ) {
                            stringBuffer = [c];
                            isExpression = true;
                        }
                    }
                }

            }
        }

        prevC = c;
    }

    return {
        workMap,
        exportIndex
    };
}

function experimentalEval(ctx, expr) {
    let workMap = breakExpression(expr).workMap;

    console.log(workMap);

    return handleWork(ctx, workMap);
}

window.ev = experimentalEval;