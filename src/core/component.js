import { iterateDom } from "./iterateDom";

const reVariables = /\{\{([\s\d\w:'",.\/-_=+~]*)}}/gi;
const reNameTest  = /this.([\w\d]+)/gi;

export class Component {
    constructor() {
        this.__target   = null;
        this._attrs     = {};
        // these are set with webpack custom loader 'data-bind-loader'
        this.__name     = null;
        this.__selector = null;
        this.__remplate = null;
    }

    init(ref) {
        this._ref          = ref;
        this._ref.__checks = {};
        this._generateProps();
    }

    test() {
        console.log('Testing', this.__name, this.__selector);
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

    _updateData(key, val) {
        //console.log(key, val);
        if ( !this._ref.__checks[key] ) { return null; }
        this._ref.__checks[key].forEach(this._updateNode.bind(this._ref));
    }

    _updateNode(target) {
        target.textContent = target.nativeValue.replace(/{{([\s\d\w:'",.\/-_=+~]+)}}/gi, (match, ex) => {
            //console.log(this, ex, eval(ex));
            return eval(ex);
        });
    }

    _checkNode(target) {
        let re = new RegExp(reVariables);
        let match;

        while (match = re.exec(target.textContent)) {
            let locRe = new RegExp(reNameTest);
            let locMatch;
            while (locMatch = locRe.exec(match[1])) {
                target.nativeValue              = target.textContent;
                this._ref.__checks[locMatch[1]] = this._ref.__checks[locMatch[1]] || [];
                this._ref.__checks[locMatch[1]].push(target);
            }

        }

        Object.keys(this._ref).forEach(key => {
            if ( key[0] !== '_' ) {
                this._updateData(key, this._ref[key]);
            }
        });
    }


    _recalcReferences() {
        this._ref.__checks      = {};
        this.__target.innerHTML = this.__template;

        iterateDom(this.__target, dom => {
            dom.childNodes.forEach(child => {
                if ( child.nodeType === 3 ) {// text
                    this._checkNode(child);
                }
            });
        });
    }

    _createSelf(target) {
        this.__target = target;
        this._recalcReferences();
    }
}
