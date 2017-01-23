import {iterateDom} from './iterateDom';

export class App {

    constructor(params) {
        this.params = params;
        this.components = params.components || [];

        this.component = {};
        this.components.forEach(component => this.component[(new component()).__component.__selector] = component);
        console.log(this.component, this.components);
    }

    init() {
        console.log('Init app', this.params);
        this.components.forEach(component => {
            (new component()).__component.test();
        });

        iterateDom(document.body, dom => {
            let tag = dom.tagName.toLowerCase();
            if ( this.component[tag] ) {
                let component = new this.component[tag]();
                component.__component._createSelf(dom);
            }
        });
    }
}
