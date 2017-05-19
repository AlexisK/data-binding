import { Component } from "core/component";

@Component({
    selector : 'input-test',
    template : './input-test.component.html'
})
export class InputTestComponent {

    constructor() {
        this.value = 'Test';
        this.dict = {
            value: 'Blah'
        };
    }
}
