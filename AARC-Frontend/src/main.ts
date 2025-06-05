import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import './styles/styles.scss'
import '@aurouscia/au-color-picker/style.css'
import { appSetup } from './app/setup/appSetup'

const pinia = createPinia().use(piniaPluginPersistedstate)
const app = createApp(App).use(pinia);

const router = appSetup()

app.use(router).mount('#app')