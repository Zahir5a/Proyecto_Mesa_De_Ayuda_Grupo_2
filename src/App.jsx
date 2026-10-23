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
import NuevoTicket from './pages/usuario/NuevoTicket';
import TicketRegistrado from './pages/usuario/TicketRegistrado';
import MisTickets from './pages/usuario/MisTickets';
import DetalleTicket from './pages/usuario/DetalleTicket';
import ColaAtencion from './pages/supervisor/ColaAtencion';
import BandejasTecnicos from './pages/supervisor/BandejasTecnicos';
import BandejaTecnico from './pages/tecnico/BandejaTecnico';
import Categorias from './pages/supervisor/Categorias';
import CategoriaFormulario from './pages/supervisor/CategoriaFormulario';
import Ambientes from './pages/supervisor/Ambientes';
import TecnicosCategoria from './pages/supervisor/TecnicosCategoria';
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
            <Route path="/usuario/nuevo-ticket" element={<NuevoTicket />}/>
            <Route path="/usuario/tickets" element={<MisTickets />}/>
            <Route path="/usuario/tickets/:codigo" element={<DetalleTicket />}/>
            <Route path="/usuario/tickets/:codigo/registrado" element={<TicketRegistrado />}/>
            <Route path="/usuario/*" element={<PaginaPendiente />}/>
          </Route>
          <Route element={<RequiereRol roles={['tecnico']} />}>
            <Route path="/tecnico" element={<BandejaTecnico key="todos" />}/>
            <Route path="/tecnico/en-atencion" element={<BandejaTecnico key="en_atencion" estadoInicial="en_atencion" />}/>
            <Route path="/tecnico/en-espera" element={<BandejaTecnico key="en_espera" estadoInicial="en_espera" />}/>
            <Route path="/tecnico/resueltos" element={<BandejaTecnico key="resuelto" estadoInicial="resuelto" />}/>
            <Route path="/tecnico/*" element={<PaginaPendiente />}/>
          </Route>
          <Route element={<RequiereRol roles={['supervisor']} />}>
            <Route path="/supervisor" element={<InicioRol />}/>
            <Route path="/supervisor/cola" element={<ColaAtencion />}/>
            <Route path="/supervisor/bandejas" element={<BandejasTecnicos />}/>
            <Route path="/supervisor/categorias" element={<Categorias />}/>
            <Route path="/supervisor/categorias/nueva" element={<CategoriaFormulario />}/>
            <Route path="/supervisor/categorias/:id" element={<CategoriaFormulario />}/>
            <Route path="/supervisor/ambientes" element={<Ambientes />}/>
            <Route path="/supervisor/tecnicos-categoria" element={<TecnicosCategoria />}/>
            <Route path="/supervisor/*" element={<PaginaPendiente />}/>
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
