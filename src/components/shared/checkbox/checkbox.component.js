import { Component } from "core/component";
require('./checkbox.component.scss');

@Component({
    selector: 'app-checkbox',
    template: './checkbox.component.html'
})
export class CheckboxComponent {
    constructor() {
        this.value = false;
        this.disabled = false;
    }

    onchange(ev) {
        this.emit('value', this.value = ev.target.checked);
    }
}

