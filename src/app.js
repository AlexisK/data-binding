import {App} from './core/app';
import {TestComponent} from './components/test/test.component';

console.log('Started');

new App({
    components: [TestComponent]
}).init();