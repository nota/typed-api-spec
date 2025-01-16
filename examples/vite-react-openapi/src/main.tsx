import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SwaggerUI url="http://localhost:3000/openapi" />
    {/*<SwaggerUI url="https://petstore.swagger.io/v2/swagger.json" />*/}
  </StrictMode>,
)
