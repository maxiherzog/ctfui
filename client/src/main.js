import { createApp } from 'vue'
import {BootstrapVueNext} from 'bootstrap-vue-next'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

const app = createApp(App)
app.use(BootstrapVueNext, {components: true, directives: true})
app.mount('#app')