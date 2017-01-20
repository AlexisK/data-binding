import { iterateDom } from "../../core/iterateDom";

const reVariables = /\{\{([\s\d\w:'",.\/-_=+~]*)}}/gi;
const reNameTest  = /this.([\w\d]+)/gi;

@Component({
    selector : 'test',
    template : './template.html'
})
export class TestComponent {

    constructor() {
        this.__checks = {};
        this.__target = null;

        this.x = 10;
        this.y = [];

        this.str = 'Hello';

        window.test = this;

        this.__generateProps();
    }

    test() {
        console.log(this.__name, this.__selector, this.__template);
    }

    __generateProps() {
        Object.keys(this).forEach(key => {
            if ( key[0] !== '_' ) {
                this['__att__' + key] = this[key];
                this.__defineGetter__(key, () => this['__att__' + key]);
                this.__defineSetter__(key, (v) => {
                    this['__att__' + key] = v;
                    this.__updateData(key, v);
                });
            }
        });
    }

    __updateData(key, val) {
        if ( !this.__checks[key] ) { return null; }
        this.__checks[key].forEach(this.__updateNode.bind(this));
    }

    __updateNode(target) {
        target.textContent = target.nativeValue.replace(/{{([\s\d\w:'",.\/-_=+~]+)}}/gi, (match, ex) => eval(ex));
    }

    __checkNode(target) {
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

        Object.keys(this).forEach(key => {
            if ( key[0] !== '_' ) {
                this.__updateData(key, this[key]);
            }
        });
    }


    __recalcReferences() {
        this.__checks           = {};
        this.__target.innerHTML = this.__template;

        iterateDom(this.__target, dom => {
            dom.childNodes.forEach(child => {
                if ( child.nodeType === 3 ) {// text
                    this.__checkNode(child);
                }
            });
        });
    }

    __createSelf(target) {
        this.__target = target;
        this.__recalcReferences();
    }
}
