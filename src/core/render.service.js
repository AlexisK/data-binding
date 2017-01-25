import { breakStringToExec } from "./utils/break-string-to-exec";
import { evalExpression } from "./utils/eval-expression";
import { storage } from "./storage.service";
import { cloneContext } from "./utils/clone-context";
import { logException } from "./utils/log-exception";

const CHECK = {
    reNameTest        : /this.([\w\d]+)/gi,
    textVarCheck      : '{{',
    textVarCheckClose : '}}',
    errorParsing      : '{{ERR}}',
    attributeFor      : '*for',
    attributeEvent    : ['(', ')'],
    attributeInput    : ['[', ']'],
    event             : '$event',
    index             : '$index',
    object            : 'object',
    empty             : ''
};

export class RenderSession {
    constructor(component) {
        this.parentNode  = component.__target;
        this.rootNode    = document.createDocumentFragment();
        this.context     = component._ref;
        this.template    = component.__template;
        this.checks      = component.__checks;
        this.isPassive   = false;
        this.updateables = [];

        this._renderBinding = {
            text : this._render_text.bind(this),
            tag  : this._render_tag.bind(this)
        };

    }

    extractVariables(string, value) {
        for (let match, re = new RegExp(CHECK.reNameTest); match = re.exec(string);) {
            this.checks[match[1]] = this.checks[match[1]] || [];
            this.checks[match[1]].push(value);
        }
    }

    update(params) {
        if ( params.node && params.node._update ) {
            params.node._update(params.ctx);
        }
    }


    render() {
        this.isPassive = false;
        this._render(this.rootNode, this.context, this.template, true);
        this.parentNode.appendChild(this.rootNode);
    }

    _render(target, ctx, template, isTop) {
        if ( template.constructor === Array ) {
            template.forEach(tpl => this._render(target, ctx, tpl));
        } else if ( template.type && this._renderBinding[template.type] ) {
            target.__rendered = target.__rendered || [];
            this._renderBinding[template.type](target, ctx, template, isTop);
        } else {
            logException('Failed to render template', {target, ctx, template});
        }
    }

    _render_text(target, ctx, template, isTop) {
        if ( template._renderMap ) {
            let node = document.createTextNode('');
            node._update = (localContext = ctx) => {
                let result = [];
                template._renderMap.forEach(val => {
                    if ( val.constructor === Array ) {
                        result.push(evalExpression(localContext, val[0]));
                    } else {
                        result.push(val)
                    }
                });
                node.textContent = result.join(CHECK.empty);
            };
            this.updateables.push(node);

            template._renderMap.forEach(val => {
                if ( val.constructor === Array ) {
                    this.extractVariables(val[0], {node, ctx});
                }
            });
            target.appendChild(node);

        } else {
            target.appendChild(document.createTextNode(template.data));
        }
    }

    _render_tag(target, ctx, template, isTop, ignoreFor) {
        if ( template._for && !ignoreFor ) {
            this._render_for(target, ctx, template);
            return 0;
        }
        if ( template._componentSelector ) {
            this._render_component(target, ctx, template, isTop);
            return 0;
        }

        let newNode = this._render_element(target, ctx, template, isTop);
        this._render(newNode, ctx, template.children);
    }

    _render_element(target, ctx, template, isTop) {
        let newNode = document.createElement(template.name);
        Object.keys(template.attribs).forEach(key => {
            try {
                newNode.setAttribute(key, template.attribs[key]);
            } catch (err) {
                logException('Failed to set attribute ' + key, {
                    [key] : template.attribs[key],
                    newNode, target, ctx, template
                })
            }
        });
        target.appendChild(newNode);
        return newNode;
    }

    _render_for(target, ctx, template, isTop) {
        let source = evalExpression(ctx, template._for[1]);
        for (let i = 0; i < source.length; i++) {
            let localCtx               = cloneContext(ctx);
            localCtx[template._for[0]] = source[i];
            localCtx[CHECK.index]      = i;
            this._render_tag(target, localCtx, template, null, true);
        }
    }

    _render_component(target, ctx, template, isTop) {
        if ( isTop ) { return 0; }

        let component = new storage.component[template._componentSelector]();
        component.__component._createSelf(target);
    }

}


export class RenderService {

    constructor() {
    }


    static iterate(parent, callback) {
        Array.from(parent.childNodes).forEach(callback);
    }

    processContent(target) {
        RenderService.iterate(target, dom => {
            if ( dom.nodeType === 1 ) {
                let tag = dom.tagName.toLowerCase();

                if ( storage.component[tag] ) {
                    let component = new storage.component[tag]();
                    component.__component._createSelf(dom);
                }
            }
        });
    }


    render(component) {
        //console.log(target, ctx, template);
        let session = new RenderSession(component);
        session.render();
        return session;
    }

}

export const renderService = new RenderService();
