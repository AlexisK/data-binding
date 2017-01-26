import { evalExpression } from "./utils/eval-expression";

const rules = {
    onclick  : (target, ctx, template) => defaultWorker(target, 'click', ctx, template._bindings.onclick),
    onchange : (target, ctx, template) => {
        defaultWorker(target, 'keyup', ctx, template._bindings.onchange);
    }
};

function defaultWorker(target, evName, ctx, expr) {
    target.addEventListener(evName, ev => {
        ctx['$event'] = ev;
        evalExpression(ctx, expr);
    })
}

export class DomEventHandlerService {
    subscribeDom(target, ctx, template) {
        if ( template._bindings ) {
            Object.keys(template._bindings).forEach(evName => {
                if ( rules[evName] ) {
                    rules[evName](target, ctx, template);
                }
            });
        }
    }
}

export const domEventHandlerService = new DomEventHandlerService();
