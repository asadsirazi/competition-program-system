import { Routes, Route } from 'react-router-dom'
import routes from './routes/routes.jsx'

function App() {
  return (
    <Routes>
      {routes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element}>
          {route.children?.map((child) => (
            <Route
              key={`${route.path}-${child.path || 'index'}`}
              index={child.index}
              path={child.path}
              element={child.element}
            />
          ))}
        </Route>
      ))}
    </Routes>
  )
}

export default App
