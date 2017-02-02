import { evalExpression } from "./utils/eval-expression";
import { storage } from "./storage.service";
import { cloneContext } from "./utils/clone-context";
import { forEach } from "./utils/for-each";
import { logWarning, logException } from "./utils/log-exception";
import { ArrayDiff } from "./utils/array-diff";
import { DomListAggregator } from "./utils/dom-list-aggregator";
import { domEventHandlerService } from './dom-event-handler.service';

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
    anch              : 'anch',
    for               : 'for',
    text              : 'text',
    empty             : ''
};

export class RenderSession {
    constructor(component) {
        this._component  = component;
        this.parentNode  = component.__target;
        this.rootNode    = document.createDocumentFragment();
        this.context     = component._attrs;
        this.template    = component.__template;
        this.checks      = component.__checks;
        this.isPassive   = false;
        this.updateables = [];

        this._insertInterval = null;

        this._renderBinding = {
            text : this._render_text.bind(this),
            tag  : this._render_tag.bind(this)
        };

    }

    createAnchor(target) {
        let newNode = document.createComment(CHECK.anch);
        target.appendChild(newNode);
        return newNode;
    }

    makeUpdateAble(target, worker) {
        target._children = [];
        target._update   = (ctx) => {
            worker(ctx);
            target._children.forEach(child => child._update());
        };
        for (let parent = target.parentNode; parent; parent = parent._parentNode || parent.parentNode) {
            if ( parent._update ) {
                parent._children.push(target);
                break;
            }
        }
        this.updateables.push(target);
    }

    extractVariables(string, value) {
        for (let match, re = new RegExp(CHECK.reNameTest); match = re.exec(string);) {
            this.checks[match[1]] = this.checks[match[1]] || [];
            this.checks[match[1]].push(value);
        }
    }

    saveVariables(list, val) {
        if ( list ) {
            list.forEach(key => {
                this.checks[key] = this.checks[key] || [];
                this.checks[key].push(val);
            });
        }
    }

    update(params) {
        if ( params.node && params.node._update ) {
            //let anchor =  document.createComment(CHECK.anch);
            //params.node.parentNode.insertBefore(anchor, params.node);
            //params.node.parentNode.removeChild(params.node);
            params.node._update(params.ctx);
            //params.node.parentNode.insertBefore(params.node, anchor);
            //params.node.parentNode.removeChild(anchor);
        }
    }

    render(isChild) {
        this.isPassive = false;
        this.rootNode  = document.createDocumentFragment();
        this._render(this.rootNode, this.context, this.template, true);
        if ( isChild ) {
            this.parentNode.appendChild(this.rootNode);
        } else {
            setTimeout(() =>
                this.parentNode.appendChild(this.rootNode), 1);
        }
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
            target.appendChild(node);

            this.makeUpdateAble(node, (localContext = ctx) => {
                let result = [];
                template._renderMap.forEach(val => {
                    if ( val.constructor === Array ) {
                        result.push(evalExpression(localContext, val[0]));
                    } else {
                        result.push(val)
                    }
                });
                node.textContent = result.join(CHECK.empty);
            });

            this.saveVariables(template._renderVars, {node, ctx});

        } else {
            target.appendChild(document.createTextNode(template.data));
        }
    }

    _render_tag(target, ctx, template, isTop, ignoreFor) {
        if ( template._for && !ignoreFor ) {
            return this._render_for(target, ctx, template);
        }
        if ( template._componentSelector ) {
            return this._render_component(target, ctx, template, isTop);
        }

        let newNode = this._render_element(target, ctx, template, isTop);
        this._render(newNode, ctx, template.children);

        domEventHandlerService.subscribeDom(newNode, this._component._ref, template);

        return newNode;
    }

    _render_element(target, ctx, template, isTop) {
        let newNode = document.createElement(template.name);
        template.attribs.forEach(pair => newNode[pair[0]] = pair[1]);
        target.appendChild(newNode);
        return newNode;
    }

    _render_for(target, ctx, template, isTop) {
        let anchor     = this.createAnchor(target);
        let collection = new DomListAggregator({
            anchor,
            onCreate : val => {
                let localCtx = cloneContext(ctx);

                localCtx[template._for[0]] = val;
                //console.log(collection.rootElement, localCtx, template);
                return this._render_tag(collection.rootElement, localCtx, template, null, true);
            },
            onDelete : this._destroy.bind(this)
        });
        //this.extractVariables(template._bindFor, {node : anchor, ctx});
        template._bindFor.forEach(v => {
            this.checks[v] = this.checks[v] || [];
            this.checks[v].push({node : anchor, ctx});
        });

        this.makeUpdateAble(anchor, (updCtx = ctx) => {
            let source = evalExpression(updCtx, template._for[1]);
            collection.fetch(source);
        });

    }

    _render_component(target, ctx, template, isTop) {
        if ( isTop ) { return 0; }

        let component = new storage.component[template._componentSelector]();

        if ( template._bindings ) {
            forEach(template._bindings, (expr, key) => {
                // TODO: pass vars only, build worker in component during execution
                component.__component.subscribeEvent(key, (val) => {
                    let lCtx = cloneContext(ctx);
                    lCtx['$event'] = val;
                    evalExpression(lCtx, expr);
                    this._component.updateByVars(template._bindVars[key]);
                });
            });
        }
        if ( template._inputs ) {
            forEach(template._inputs, (inp, key) => {
                //console.log(component, ctx, template._inputs[key]);
                component[key] = evalExpression(ctx, inp);
            });
        }

        component.__component._createSelf(target, true);
    }

    _destroy(node) {
        // TODO: clean-up memory and relations
        try {
            node.parentNode.removeChild(node);
        } catch (err) {
            logWarning('Failed to remove node from DOM', {node});
        }
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
                } else {
                    this.processContent(dom);
                }
            }
        });
    }


    render(component, isChild) {
        //console.log(target, ctx, template);
        let session = new RenderSession(component);
        session.render(isChild);
        return session;
    }

}

export const renderService = new RenderService();
