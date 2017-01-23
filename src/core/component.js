import { iterateDom } from "./iterateDom";
import { subscribeEventLoopUpdate } from "./event-loop-update";

const reVariables = /\{\{([\s\d\w:'",.\/-_=+~]*)}}/gi;
const reNameTest  = /this.([\w\d]+)/gi;

export class Component {


    // startup
    constructor() {
        this.__app          = null;
        this.__target       = null;
        this._attrs         = {};
        // these are set with webpack custom loader 'data-bind-loader'
        this.__name         = null;
        this.__selector     = null;
        this.__template     = null;
        this.__updateMethod = null;
    }

    init(ref) {
        this._ref        = ref;
        this.__checks    = {};
        this.__checksFor = {};
        this._initUpdateSubscribe();
    }

    test() {
        console.log('Testing', this.__name, this.__selector);
    }


    // updateMethods
    _initUpdateSubscribe() {
        this['_updateSubscribe_' + this.__updateMethod]();
    }

    _updateSubscribe_property() {
        this._generateProps();
    }

    _updateSubscribe_constant() {
        subscribeEventLoopUpdate(this._blankUpdate.bind(this));
    }

    _generateProps() {
        //console.log(this);
        Object.keys(this._ref).forEach(key => {
            if ( key[0] !== '_' ) {
                this._attrs[key] = this._ref[key];
                this._ref.__defineGetter__(key, () => this._attrs[key]);
                this._ref.__defineSetter__(key, (v) => {
                    this._attrs[key] = v;
                    this._updateData(key, v);
                });
            }
        });
    }


    // triggers
    _blankUpdate() {
        Object.keys(this._ref).forEach(key => {
            if ( key[0] !== '_' ) {
                this._updateData(key, this._ref[key]);
            }
        });
        console.log(this);
    }


    // processing
    static _createAnchor(target) {
        let anchor = document.createComment(target.tagName);
        target.parentNode.insertBefore(anchor, target);
        return anchor;
    }

    static _getDomData(target) {
        return {
            tag       : target.tagName.toLowerCase(),
            className : target.className
        };
    }

    static _getForReference(content) {
        let match = (new RegExp(reNameTest)).exec(content.split(' in ')[1]);
        return match[1];
    }


    _recalcReferences() {
        this.__checks           = {};
        this.__target.innerHTML = this.__template;

        iterateDom(this.__target, dom => {
            let ok      = true;
            let domData = Component._getDomData(dom);

            for (let i = 0; ok && i < dom.attributes.length; i++) {
                let attr = dom.attributes[i];
                if ( attr.specified ) {
                    //attr.name; attr.value

                    if ( attr.name === '*for' ) {
                        let anchor      = Component._createAnchor(dom);
                        anchor._forRule = attr.value;
                        anchor._domData = domData;
                        anchor._ownElems = [];
                        anchor._content = dom.innerHTML;

                        let key = Component._getForReference(attr.value);
                        this.__checksFor[key] = this.__checksFor[key] || [];
                        this.__checksFor[key].push(anchor);

                        dom.parentNode.removeChild(dom);
                        ok = false;
                    }
                }
            }
            if ( ok ) {

                if ( this.__app.component[domData.tag] ) {
                    let component = new this.__app.component[domData.tag]();
                    component.__component._createSelf(dom, this.__app);
                } else {
                    dom.childNodes.forEach(child => {
                        if ( child.nodeType === 3 ) {// text
                            this._checkNodeVariables(child);
                        }
                    });
                }
            }

        });
        this._blankUpdate();
    }


    _createSelf(target, app) {
        this.__app    = app;
        this.__target = target;
        this._recalcReferences();
    }


    // update process
    _updateData(key, val) {
        if ( this.__checksFor[key] ) {
            this.__checksFor[key].forEach(this._renderFor.bind(this._ref));
        }
        if ( this.__checks[key] ) {
            this.__checks[key].forEach(this._updateNode.bind(this._ref));
        }
    }

    _updateNode(target) {
        target.textContent = target.nativeValue.replace(/{{([\s\d\w:'"\[\],.\/-_=+~]+)}}/gi, (match, ex) => {
            return eval(ex);
        });
    }
    _renderFor(target) {
        target._ownElems.forEach(elem => elem.parentNode.removeChild(elem));
        target._ownElems = [];
        let [varName, evalFrom] = target._forRule.split(' in ');
        let source = eval(evalFrom);


        for ( let i = 0; i < source.length; i++) {
            let localVar = source[i];

            let newNode = document.createElement(target._domData.tag);
            newNode.className = target._domData.className;
            newNode.innerHTML = target._content.replace(reVariables, (match, ex) => {
                return eval(ex.replace(varName, 'localVar'));
            });
            target.parentNode.insertBefore(newNode, target);
            target._ownElems.push(newNode);

        }
    }

    _checkNodeVariables(target) {
        let re = new RegExp(reVariables);
        let match;

        while (match = re.exec(target.textContent)) {
            let locRe = new RegExp(reNameTest);
            let locMatch;
            while (locMatch = locRe.exec(match[1])) {
                target.nativeValue         = target.textContent;
                this.__checks[locMatch[1]] = this.__checks[locMatch[1]] || [];
                this.__checks[locMatch[1]].push(target);
            }

        }
    }
}
