import { App } from 'core/app.js';
import { TestComponent } from './components/test/test.component';
import { InputTestComponent } from './components/input-test/input-test.component';
import { ListComponent } from "./components/list/list.component";
import { ListInputComponent } from "./components/list/list-input/list-input.component";
import { ListItemComponent } from "./components/list/list-item/list-item.component";
import { sharedComponents } from "./components/shared";

require('./app.scss');

console.log('Started');

new App({
    components : [TestComponent, InputTestComponent, ListComponent, ListInputComponent, ListItemComponent, ...sharedComponents]
}).init();
