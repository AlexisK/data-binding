import { breakStringToExec } from "./utils/break-string-to-exec";
import { evalExpression } from "./utils/eval-expression";

const CHECK = {
    reNameTest        : /this.([\w\d]+)/gi,
    textVarCheck      : '{{',
    textVarCheckClose : '}}',
    errorParsing      : '{{ERR}}',
    attributeFor      : '*for'
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
    }

    static iterate(parent, callback) {
        Array.from(parent.childNodes).forEach(callback);
    }

    static createAnchor(target) {
        let newNode = document.createComment(target.tagName);
        target.parentNode.insertBefore(newNode, target);
        return newNode;
    }


    //                |
    // render process |
    //                |
    render(target, context = this.defaultContext) {
        let worker = this.renderWorkersBinding[target.nodeType];
        if ( worker ) {
            worker(target, context);
        }
    }

    renderWorker_text(dom, context) {
        if ( dom.__render ) {
            dom.__render(context);
        }
    }

    renderWorker_comment(dom, context) {
        if ( dom.__render ) {
            dom.__render(context);
        }
    }

    renderWorker_element(target, context) {
        RenderService.iterate(target, dom => {
            this.render(dom, context);
        });
    }


    //                             |
    // normalize (prepare) process |
    //                             |
    normalize(target, variablesMapping = {}) {

        let worker = this.normalizeWorkersBinding[target.nodeType];
        if ( worker ) {
            worker(target, variablesMapping);
        }

        return variablesMapping;
    }

    normalizeWorker_text(dom, variablesMapping) {
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

    normalizeWorker_comment(dom, variablesMapping) {}

    normalizeWorker_element(target, variablesMapping) {
        let attrFor = target.getAttribute(CHECK.attributeFor);

        if ( attrFor ) {
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
                let source = evalExpression(ctx, anchor.__rules[1]);
                for (let i = 0; i < source.length; i++) {
                    let localCtx = Object.assign({}, ctx);
                    localCtx[anchor.__rules[0]] = source[i];

                    let newNode = document.createElement(anchor.__originalDom.tagName);
                    anchor.parentNode.insertBefore(newNode, anchor);
                    anchor.__ownNodes.push(newNode);
                    newNode.innerHTML = anchor.__originalDom.innerHTML;
                    newNode.__checks = this.normalize(newNode);
                    this.render(newNode, localCtx);
                }
            }
        } else {
            RenderService.iterate(target, dom => {
                this.normalize(dom, variablesMapping);
            });
        }
    }
}

export const renderService = new RenderService();
