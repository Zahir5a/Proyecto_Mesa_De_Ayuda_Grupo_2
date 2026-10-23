import { Route, Routes } from 'react-router-dom';
import Landing from './pages/publico/Landing';
import Login from './pages/auth/Login';
import Registro from './pages/auth/Registro';
import RecuperarPassword from './pages/auth/RecuperarPassword';
import AltaInvitacion from './pages/auth/AltaInvitacion';
import ComoReportar from './pages/publico/ComoReportar';
import LayoutPublico from './components/layout/LayoutPublico';
import LayoutApp from './components/layout/LayoutApp';
import NoEncontrado from './pages/errores/NoEncontrado';
import InicioRol from './pages/rol/InicioRol';
import PaginaPendiente from './pages/rol/PaginaPendiente';
import MiCuenta from'./pages/cuenta/MiCuenta';
import RutaProtegida from './components/layout/RutaProtegida';
import RutaSoloVisitante from './components/layout/RutaSoloVisitante';
import RequiereRol from './components/layout/RequiereRol';

function App() {
  return (
    <Routes>
      <Route element={<LayoutPublico />}>
        <Route path="/" element={<Landing />}/>
        <Route path="/como-reportar" element={<ComoReportar />}/>
        <Route element={<RutaSoloVisitante />}>
          <Route path="/login" element={<Login />}/>
          <Route path="/registro" element={<Registro />}/>
          <Route path="/recuperar-contrasena" element={<RecuperarPassword />}/>
          <Route path="/invitacion/:token" element={<AltaInvitacion />}/>
        </Route>
        <Route path="*" element={<NoEncontrado />}/>
      </Route>

      <Route element={<RutaProtegida />}>
        <Route element={<LayoutApp />}>
          <Route path="/cuenta" element={<MiCuenta />}/>
          <Route element={<RequiereRol roles={['usuario']} />}>
            <Route path="/usuario" element={<InicioRol />}/>
            <Route path="/usuario/*" element={<PaginaPendiente />}/>
          </Route>
          <Route element={<RequiereRol roles={['tecnico']} />}>
            <Route path="/tecnico" element={<InicioRol />}/>
            <Route path="/tecnico/*" element={<PaginaPendiente />}/>
          </Route>
          <Route element={<RequiereRol roles={['supervisor']} />}>
            <Route path="/supervisor" element={<InicioRol />}/>
            <Route path="/supervisor/*" element={<PaginaPendiente />}/>
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
