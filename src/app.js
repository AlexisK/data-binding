import * as mdc from 'material-components-web';

import { App } from 'core/app.js';
import { TestComponent } from './components/test/test.component';
import { ListComponent } from "./components/list/list.component";
import { ListInputComponent } from "./components/list/list-input/list-input.component";
import { ListItemComponent } from "./components/list/list-item/list-item.component";
import { RetrieveApiTestComponent } from './components/retrieve-api-test/retrieve-api-test.component';
import { RepoItemComponent } from './components/retrieve-api-test/repo-item/repo-item.component';
//import { sharedComponents } from "./components/shared";
import { InputComponent } from "./components/shared/input/input.component";
import { CheckboxComponent } from "./components/shared/checkbox/checkbox.component";
import { ProgressBarComponent } from "./components/shared/progress-bar/progress-bar.component";

require('./app.scss');

console.log('Started');

new App({
    components : [
        TestComponent, ListComponent, ListInputComponent, ListItemComponent, RetrieveApiTestComponent, RepoItemComponent,
        InputComponent, CheckboxComponent, ProgressBarComponent
    ]
}).init();

setTimeout(() => mdc.autoInit(), 1);
