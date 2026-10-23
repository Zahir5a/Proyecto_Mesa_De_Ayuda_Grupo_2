import { Route, Routes } from 'react-router-dom';
import Landing from './pages/publico/Landing';
import Login from './pages/auth/Login';
import LayoutPublico from './components/layout/LayoutPublico';
import NoEncontrado from './pages/errores/NoEncontrado';
import InicioRol from './pages/rol/InicioRol';
import RutaProtegida from './components/layout/RutaProtegida';
import RequiereRol from './components/layout/RequiereRol';

function App() {
  return (
    <Routes>
      <Route element={<LayoutPublico />}>
        <Route path="/" element={<Landing />}/>
        <Route path="/login" element={<Login />}/>

        <Route element={<RutaProtegida />}>
          <Route element={<RequiereRol roles={['usuario']} />}>
            <Route path="/usuario" element={<InicioRol />}/>
          </Route>
          <Route element={<RequiereRol roles={['tecnico']} />}>
            <Route path="/tecnico" element={<InicioRol />}/>
          </Route>
          <Route element={<RequiereRol roles={['supervisor']} />}>
            <Route path="/supervisor" element={<InicioRol />}/>
          </Route>
        </Route>


        <Route path="*" element={<NoEncontrado />}/>
      </Route>
    </Routes>
  )
}

export default App
