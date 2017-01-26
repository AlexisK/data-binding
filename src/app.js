import { App } from 'core/app.js';
import { TestComponent } from './components/test/test.component';
import { ListComponent } from "./components/list/list.component";
import { ListInputComponent } from "./components/list/list-input/list-input.component";
import { ListItemComponent } from "./components/list/list-item/list-item.component";

require('./app.scss');

console.log('Started');

new App({
    components : [TestComponent, ListComponent, ListInputComponent, ListItemComponent]
}).init();