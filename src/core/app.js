import { iterateDom } from './utils/iterate-dom';
import { storage } from "./storage.service";
import { renderService } from "./render.service";

export class App {

    constructor(params) {
        this.params     = params;
        this.components = params.components || [];

        storage.component = {};
        this.components.forEach(component => {
            storage.component[(new component()).__component.__selector] = component;
        });
    }

    init() {
        console.log('Init app', this.params);
        //this.components.forEach(component => {
        //    (new component()).__component.test();
        //});

        //renderService.normalize(document.body);
        //renderService.render(document.body);

        renderService.processContent(document.body);

        //iterateDom(document.body, dom => {
        //    let tag = dom.tagName.toLowerCase();
        //    if ( storage.component[tag] ) {
        //        let component = new storage.component[tag]();
        //        component.__component._createSelf(dom);
        //    }
        //});
    }
}
