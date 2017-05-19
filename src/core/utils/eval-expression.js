import { logWarning, logException } from "./log-exception";

//                                                               //
//                    E X P E R I M E N T A L                    //
//                                                               //


const TYPE = {
    string        : 1,
    operator      : 2,
    expression    : 3,
    expressionMap : 4,
    scope         : 5,
    number        : 6,
    function      : 7
};

const OPERATOR = {
    plus  : 1,
    minus : 2,
    mult  : 3,
    div   : 4,
    perc  : 5,
    and   : 6,
    or    : 7,
    ass   : 8
};


let __updateInterval = null;
export function evalExpression(ctx, expr) {
    let result = handleWork(ctx, expr.workMap);
    //console.log(expr, ctx);
    //console.log(result);

    //if ( result.isFunctionExecuted ) {
    //    clearInterval(__updateInterval);
    //    __updateInterval = setTimeout(() => {
    //        ctx.__component.updateByVars(extractVars(expr.workMap));
    //    }, 1);
    //}

    return result.result[0];
}


function addr(obj, keyChain, index = 0) {
    if ( !obj || keyChain.length === index ) {
        return obj;
    }
    return addr(obj[keyChain[index]], keyChain, index + 1);
}

function addrWrite(obj, keyChain, value) {
    if ( keyChain.length == 0 ) {
        return null;
    }
    if ( typeof(keyChain) === 'string' ) {
        return _addrWrite(obj, [keyChain], value, 0);
    }
    let result = _addrWrite(obj, keyChain, value, 0);

    if ( keyChain.length > 1) {
        // trigger setter
        obj[keyChain[0]] = obj[keyChain[0]];
    }

    return result;
}

function _addrWrite(obj, keyChain, value, index) {
    if ( !obj || keyChain.length - 1 === index ) {
        return obj[keyChain[index]] = value;
    }
    return _addrWrite(obj[keyChain[index]], keyChain, value, index + 1);
}


function extractVars(workMap) {
    let result = [];
    workMap.forEach(pair => {
        if ( pair[0] === TYPE.expression ) {
            result.push(pair[1]);
        } else if ( pair[0] === TYPE.expressionMap ) {
            result.push(pair[1][0]);
        }
    });
    return result;
}


// Work by index
function handleItem(ctx, pair) {
    if ( !pair ) { return null; }
    if ( pair[0] === TYPE.scope ) {
        return handleWork(ctx, pair[1]).result;
    } else if ( pair[0] === TYPE.string || pair[0] === TYPE.number ) {
        return pair[1];
    } else if ( pair[0] === TYPE.expression ) {
        return ctx[pair[1]];
    } else if ( pair[0] === TYPE.expressionMap ) {
        return addr(ctx, pair[1]);
    }
    return null;
}

// Build work & index jumps
function handleWork(ctx, workMap) {
    let result             = [];
    let isFunctionExecuted = false;

    for (let i = 0; i < workMap.length; i++) {
        let pair = workMap[i];

        let handled = handleItem(ctx, pair);
        if ( handled ) {
            result.push(handled);
        } else {
            if ( pair[0] === TYPE.function ) {
                let args = workMap[i + 1];
                if ( args ) { args = args[1]; } else { args = []; }
                //console.log(pair[1], args);

                ctx[pair[1]].apply(ctx, handleWork(ctx, args).result);
                isFunctionExecuted = true;

                i++;
            } else if ( pair[0] === TYPE.operator ) {
                let leftOperand = result.pop();
                i++;

                if ( pair[1] === OPERATOR.plus ) {
                    result.push(leftOperand + handleItem(ctx, workMap[i]));
                } else if ( pair[1] === OPERATOR.minus ) {
                    result.push(leftOperand - handleItem(ctx, workMap[i]));
                } else if ( pair[1] === OPERATOR.mult ) {
                    result.push(leftOperand * handleItem(ctx, workMap[i]));
                } else if ( pair[1] === OPERATOR.div ) {
                    result.push(leftOperand / handleItem(ctx, workMap[i]));
                } else if ( pair[1] === OPERATOR.perc ) {
                    result.push(leftOperand % handleItem(ctx, workMap[i]));
                } else if ( pair[1] === OPERATOR.and ) {
                    result.push(leftOperand && handleItem(ctx, workMap[i]));
                } else if ( pair[1] === OPERATOR.or ) {
                    result.push(leftOperand || handleItem(ctx, workMap[i]));
                } else if ( pair[1] === OPERATOR.ass ) {
                    //console.log(workMap, leftOperand);
                    result.push(addrWrite(ctx, workMap[0][1], handleItem(ctx, workMap[i])));
                }
            }
        }

    }
    //console.log(result);
    return {
        result,
        isFunctionExecuted
    };
}


// Depricated


const CHECK = {
    eval         : ['with(this) { return (', '); }'],
    errorParsing : '{{ERR}}',
    reUpdateVars : /@update\(([\s\w\d,\-_]+)\);?/gi
};


function evalExpression_old(ctx, expr) {
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


window.ev    = evalExpression;
window.evOld = evalExpression_old;