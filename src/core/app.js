import { iterateDom } from './iterateDom';
import { storageService } from "./storage.service";

export class App {

    constructor(params) {
        this.params     = params;
        this.components = params.components || [];

        storageService.component = {};
        this.components.forEach(component => {
            storageService.component[(new component()).__component.__selector] = component;
        });
    }

    init() {
        console.log('Init app', this.params);
        //this.components.forEach(component => {
        //    (new component()).__component.test();
        //});

        iterateDom(document.body, dom => {
            let tag = dom.tagName.toLowerCase();
            if ( storageService.component[tag] ) {
                let component = new storageService.component[tag]();
                component.__component._createSelf(dom);
            }
        });
    }
}
