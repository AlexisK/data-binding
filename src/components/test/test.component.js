import { Component } from "core/component";
require('./test.component.scss');

@Component({
    selector : 'test',
    template : './template.html'
})
export class TestComponent {

    constructor() {
        this.x = 10;
        this.params = {
            a: true,
            b: false
        };

        this.str = 'Hello';
    }

}
