import { Component } from "core/component";
require('./git-profile.component.scss');

@Component({
    selector: 'app-git-profile',
    template: './git-profile.component.html'
})
export class GitProfileComponent {
    constructor() {
        this.profile = {};
    }
}

