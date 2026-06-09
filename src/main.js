import { createApp }   from 'vue'
import { createPinia } from 'pinia'
import ElementPlus     from 'element-plus'
import * as Icons      from '@element-plus/icons-vue'
import vi              from 'element-plus/es/locale/lang/vi'
import 'element-plus/dist/index.css'
import './assets/main.css'
import App    from './App.vue'
import router from './router'

const app = createApp(App)

// Đk icon Element Plus
Object.entries(Icons).forEach(([key, comp]) => app.component(key, comp))

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: vi })

app.mount('#app')
