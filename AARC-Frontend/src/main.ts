import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles.scss'
import '@aurouscia/au-color-picker/style.css'

const app = createApp(App);
const pinia = createPinia()

app.use(pinia).mount('#app')