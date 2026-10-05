import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, App as AntApp } from 'antd'
import './index.css'
import App from './App.jsx'
import { antdTheme } from './constants/theme'
import { AdminStoreProvider } from './store/AdminStore'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ConfigProvider theme={antdTheme}>
            <AntApp>
                <AdminStoreProvider>
                    <App />
                </AdminStoreProvider>
            </AntApp>
        </ConfigProvider>
    </StrictMode>,
)
