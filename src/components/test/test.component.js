import { Component } from "core/component";

@Component({
    selector : 'test',
    template : './template.html'
})
export class TestComponent {

    constructor() {
        this.x = 10;
        this.y = [];

        this.str = 'Hello';

        window.test = this;
    }

}
