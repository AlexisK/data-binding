import { breakStringToExec } from "./utils/break-string-to-exec";
import { evalExpression } from "./utils/eval-expression";
import { storage } from "./storage.service";

const CHECK = {
    reNameTest        : /this.([\w\d]+)/gi,
    textVarCheck      : '{{',
    textVarCheckClose : '}}',
    errorParsing      : '{{ERR}}',
    attributeFor      : '*for',
    attributeEvent    : ['(', ')'],
    attributeInput    : ['[', ']'],
    event             : '$event'
};

export class RenderService {

    constructor() {
        this.defaultContext          = window;
        this.renderWorkersBinding    = {
            1 : this.renderWorker_element.bind(this),
            3 : this.renderWorker_text.bind(this),
            8 : this.renderWorker_comment.bind(this)
        };
        this.normalizeWorkersBinding = {
            1 : this.normalizeWorker_element.bind(this),
            3 : this.normalizeWorker_text.bind(this),
            8 : this.normalizeWorker_comment.bind(this)
        };
        this.eventHandlersBinding = {
            'onchange': RenderService.handleEvent_onchange.bind(this)
        }
    }


    static iterate(parent, callback) {
        Array.from(parent.childNodes).forEach(callback);
    }

    static createAnchor(target) {
        let newNode = document.createComment(target.tagName);
        target.parentNode.insertBefore(newNode, target);
        return newNode;
    }


    static processInnerComponent(target, tag) {
        if ( !target.__ownComponent ) {
            target.__ownComponent = new storage.component[tag]();
            target.__ownComponent.__component._createSelf(target);
        }
        return 0;
    }


    // Events
    handleElementEventAttribute(target, eventName, expr, ctx) {
        if ( this.eventHandlersBinding[eventName] ) {
            this.eventHandlersBinding[eventName](target, eventName, expr, ctx);
        } else {
            this.handleEvent__universal(target, eventName, expr, ctx);
        }
    }

    handleEvent__universal(target, eventName, expr, ctx) {
        if ( target.__component ) {
            target.__component.subscribeEvent(eventName, ev => {
                let localCtx = target.__parentContext || ctx;
                localCtx[CHECK.event] = ev;
                evalExpression(localCtx, expr);
            });
        }
    }

    static handleEvent_onchange(target, eventName, expr, ctx) {
        target.addEventListener('keyup', ev => {
            ctx[CHECK.event] = ev;
            evalExpression(ctx, expr);
        });
    }


    //                |
    // Render process |
    //                |
    render(target, context = this.defaultContext) {
        this._render(target, context, true)
    }

    _render(target, context, isTop) {
        let worker = this.renderWorkersBinding[target.nodeType];
        if ( worker ) {
            worker(target, context, isTop);
        }
    }

    renderWorker_text(dom, context, isTop) {
        if ( dom.__render ) {
            dom.__render(context);
        }
    }

    renderWorker_comment(dom, context, isTop) {
        if ( dom.__render ) {
            dom.__render(context);
        }
    }

    renderWorker_element(target, context, isTop) {
        //console.log(target);

        if ( isTop || !target.__ownComponent ) {
            for (let i = 0; i < target.attributes.length; i++) {
                let attr = target.attributes[i];
                //console.log('\t',attr.name);
                if ( attr.name[0] === CHECK.attributeEvent[0] ) {
                    let eventName = attr.name.slice(1, -1);
                    this.handleElementEventAttribute(target, eventName, attr.value, context);
                }
            }

            RenderService.iterate(target, dom => {
                this._render(dom, context);
            });
        } else {
            target.__parentContext = context;
        }
    }


    //                             |
    // Normalize (prepare) process |
    //                             |
    normalize(target, variablesMapping = {}) {
        return this._normalize(target, variablesMapping, true);
    }

    _normalize(target, variablesMapping, isTop) {

        let worker = this.normalizeWorkersBinding[target.nodeType];
        if ( worker ) {
            worker(target, variablesMapping, isTop);
        }

        return variablesMapping;
    }

    normalizeWorker_text(dom, variablesMapping, isTop) {
        if ( !dom.__render && dom.textContent.indexOf(CHECK.textVarCheck) >= 0 ) {
            let stringExec = breakStringToExec(dom.textContent);
            stringExec.usedVariables.forEach(key => {
                variablesMapping[key] = variablesMapping[key] || [];
                variablesMapping[key].push(dom);
            });

            dom.__render    = ctx => {
                return dom.textContent = stringExec(ctx);
            };
            window.__render = dom.__render;
        }
    }

    normalizeWorker_comment(dom, variablesMapping, isTop) {}

    normalizeWorker_element(target, variablesMapping, isTop) {
        let attrFor = target.getAttribute(CHECK.attributeFor);
        let tag     = target.tagName.toLowerCase();

        if ( attrFor ) {
            this.processInnerFor(target, variablesMapping, attrFor);
        } else if ( !isTop && storage.component[tag] ) {
            RenderService.processInnerComponent(target, tag);
        } else {
            RenderService.iterate(target, dom => {
                this._normalize(dom, variablesMapping);
            });
        }
    }

    processInnerFor(target, variablesMapping, attrFor) {
        let anchor           = RenderService.createAnchor(target);
        anchor.__originalDom = target;
        anchor.__rules       = attrFor.split(' in ');
        target.removeAttribute(CHECK.attributeFor);
        target.parentNode.removeChild(target);
        anchor.__ownNodes = [];

        let match;
        while (match = CHECK.reNameTest.exec(anchor.__rules[1])) {
            variablesMapping[match[1]] = variablesMapping[match[1]] || [];
            variablesMapping[match[1]].push(anchor);
        }

        anchor.__render = ctx => {
            anchor.__ownNodes.forEach(dom => dom.parentNode.removeChild(dom));
            anchor.__ownNodes = [];
            let source        = evalExpression(ctx, anchor.__rules[1]);
            for (let i = 0; i < source.length; i++) {
                let localCtx                = Object.assign({}, ctx);
                localCtx[anchor.__rules[0]] = source[i];

                let newNode       = document.createElement(anchor.__originalDom.tagName);
                newNode.className = anchor.__originalDom.className;
                newNode.innerHTML = anchor.__originalDom.innerHTML;
                newNode.__checks  = this.normalize(newNode);
                anchor.parentNode.insertBefore(newNode, anchor);

                anchor.__ownNodes.push(newNode);
                this.render(newNode, localCtx);
            }
        }
    }
}

export const renderService = new RenderService();
