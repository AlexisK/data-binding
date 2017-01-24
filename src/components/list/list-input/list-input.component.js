import { Component } from "core/component";

@Component({
    selector : 'list-input',
    template : './list-input.component.html'
})
export class ListInputComponent {
    constructor() {
        this.value = '';
    }

    valueUpdated(ev, val) {
        if ( ev.keyCode === 13 ) {
            this.emit('onsubmit', val);
        }
    }

}
