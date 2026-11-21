import { Route, Routes, Navigate } from 'react-router-dom'
import Pendiente from './compartido/ui/Pendiente'
import RutaProtegida from './compartido/sesion/RutaProtegida'
import ConCredencialPropia from './compartido/sesion/ConCredencialPropia'
import CambiarContrasena from './roles/acceso/paginas/CambiarContrasena'
import ElegirPin from './roles/acceso/paginas/ElegirPin'
import LoginAdmin from './roles/acceso/paginas/LoginAdmin'
import LoginPin from './roles/acceso/paginas/LoginPin'
import { PaginaMenuCliente } from './roles/cliente/paginas/PaginaMenuCliente'
import PaginaPedidoCliente from './roles/cliente/paginas/PaginaPedidoCliente'
import PaginaCuentaCliente from './roles/cliente/paginas/PaginaCuentaCliente'

// Pantalla del salón (P-20, HU-17): pública, el token de la dirección dice de qué local es
import { PantallaPublicaPage } from './roles/salon/paginas/PantallaPublicaPage'

// Rutas del Mozo
import MarcoMozo from './roles/mozo/componentes/MarcoMozo'
import MisMesas from './roles/mozo/paginas/MisMesas'
import DetalleMesa from './roles/mozo/paginas/DetalleMesa'
import Avisos from './roles/mozo/paginas/Avisos'
import MiTurno from './roles/mozo/paginas/MiTurno'

// Rutas de Caja
import MarcoCaja from './roles/caja/componentes/MarcoCaja'
import { CierreCuentaPage } from './roles/caja/paginas/CierreCuentaPage'
import ColaAprobacion from './roles/caja/paginas/ColaAprobacion'
import DisponibilidadRapida from './roles/caja/paginas/DisponibilidadRapida'
import PedidosAprobados from './roles/caja/paginas/PedidosAprobados'

// Rutas de Cocina
import ColaCocina from './roles/cocina/paginas/ColaCocina'

// Rutas del Admin
import MarcoAdmin from './roles/admin/componentes/MarcoAdmin'
import CartaAdmin from './roles/admin/paginas/CartaAdmin'
import CategoriasYEtiquetas from './roles/admin/paginas/CategoriasYEtiquetas'
import FormularioDePlato from './roles/admin/paginas/FormularioDePlato'
import InicioDelAdmin from './roles/admin/paginas/InicioDelAdmin'
import AdministradoresAdmin from './roles/admin/paginas/AdministradoresAdmin'
import GestionMesasPage from './roles/admin/paginas/GestionMesasPage'
import ConfiguracionAdmin from './roles/admin/paginas/ConfiguracionAdmin'
import SoloPara from './roles/admin/componentes/SoloPara'
import { LOS_DOS, SOLO_ADMIN, SOLO_GERENTE } from './roles/admin/secciones'

export default function App() {
  return (
    <Routes>
      <Route path="/mesa/:token" element={<PaginaMenuCliente />} />
      <Route path="/mesa/:token/pedido" element={<PaginaPedidoCliente />} />
      <Route path="/mesa/:token/cuenta" element={<PaginaCuentaCliente />} />
      <Route path="/staff/:token" element={<LoginPin />} />
      <Route path="/staff/:token/caja" element={<LoginPin caja />} />
      <Route path="/staff/:token/elegir-pin" element={<ElegirPin />} />
      <Route path="/admin/login" element={<LoginAdmin />} />
      <Route path="/admin/cambiar-contrasena" element={<CambiarContrasena />} />
      <Route path="/pantalla/:token" element={<PantallaPublicaPage />} />
      
      {/* Vista del Mozo */}
      <Route
        path="/mozo"
        element={
          <RutaProtegida roles={['MOZO']}>
            <ConCredencialPropia>
              <MarcoMozo />
            </ConCredencialPropia>
          </RutaProtegida>
        }
      >
        <Route index element={<Navigate to="mesas" replace />} />
        <Route path="mesas" element={<MisMesas />} />
        <Route path="mesas/:mesaId" element={<DetalleMesa />} />
        <Route path="avisos" element={<Avisos />} />
        <Route path="turno" element={<MiTurno />} />
      </Route>

      {/* Caja: el marco con el menú lateral y sus pantallas */}
      <Route
        path="/caja"
        element={
          <RutaProtegida roles={['CAJA']}>
            <ConCredencialPropia>
              <MarcoCaja />
            </ConCredencialPropia>
          </RutaProtegida>
        }
      >
        <Route index element={<Navigate to="pedidos" replace />} />
        <Route path="pedidos" element={<ColaAprobacion />} />
        {/* Cuentas por cobrar y cierre (P-09, HU-10) */}
        <Route path="cuentas" element={<CierreCuentaPage />} />
        {/* Disponibilidad rápida (P-10, HU-09) */}
        <Route path="disponibilidad" element={<DisponibilidadRapida />} />
        {/* Pedidos aprobados: priorizar y cancelar (P-36, HU-08) */}
        <Route path="aprobados" element={<PedidosAprobados />} />
      </Route>

      {/* Cocina: el KDS (P-11) */}
      <Route
        path="/cocina/*"
        element={
          <RutaProtegida roles={['COCINA']}>
            <ConCredencialPropia>
              <ColaCocina />
            </ConCredencialPropia>
          </RutaProtegida>
        }
      />

      {/* Admin: el marco con el menú lateral y sus pantallas. /admin/login y /admin/cambiar-contrasena van arriba. */}
      <Route
        path="/admin"
        element={
          <RutaProtegida roles={['ADMIN', 'GERENTE_DUENO']}>
            <ConCredencialPropia>
              <MarcoAdmin />
            </ConCredencialPropia>
          </RutaProtegida>
        }
      >
        {/* El inicio de cada rol: el Gerente/Dueño va a Administradores y el Admin a Menú. Cada pantalla va en
            SoloPara con los roles de su sección (roles/admin/secciones.ts): la que no es del rol manda al inicio. */}
        <Route index element={<InicioDelAdmin />} />
        <Route path="dashboard" element={<SoloPara roles={SOLO_ADMIN}><Pendiente titulo="Dashboard" /></SoloPara>} />
        {/* La carta (P-14, HU-12). El alta y la edición (P-14b) y las categorías (P-14c) cuelgan de acá. */}
        <Route path="menu" element={<SoloPara roles={SOLO_ADMIN}><CartaAdmin /></SoloPara>} />
        <Route path="menu/categorias" element={<SoloPara roles={SOLO_ADMIN}><CategoriasYEtiquetas /></SoloPara>} />
        <Route path="menu/nuevo" element={<SoloPara roles={SOLO_ADMIN}><FormularioDePlato /></SoloPara>} />
        <Route path="menu/:platoId" element={<SoloPara roles={SOLO_ADMIN}><FormularioDePlato /></SoloPara>} />
        {/* Mesas y QR (P-15) y el QR impreso (P-38), HU-13. */}
        <Route path="mesas" element={<SoloPara roles={SOLO_ADMIN}><GestionMesasPage /></SoloPara>} />
        <Route path="empleados" element={<SoloPara roles={SOLO_ADMIN}><Pendiente titulo="Empleados y turnos" /></SoloPara>} />
        <Route path="reportes" element={<SoloPara roles={LOS_DOS}><Pendiente titulo="Reportes" /></SoloPara>} />
        <Route path="auditoria" element={<SoloPara roles={LOS_DOS}><Pendiente titulo="Auditoría" /></SoloPara>} />
        {/* Los Admins del local, con el alta en la misma pantalla (P-19, HU-16). Solo el Gerente/Dueño. */}
        <Route path="administradores" element={<SoloPara roles={SOLO_GERENTE}><AdministradoresAdmin /></SoloPara>} />

        {/* Disponibilidad rápida del Admin (P-10c, HU-09). El padding extra lleva los 24 px de la pantalla de
            Caja a los 32 × 28 del Mockup del Admin. */}
        <Route
          path="disponibilidad"
          element={
            <SoloPara roles={SOLO_ADMIN}>
              <div className="min-h-full px-2 pt-1">
                <DisponibilidadRapida subtitulo="Lo mismo que ve Caja (P-10): el Admin lo usa de respaldo cuando Caja no está" />
              </div>
            </SoloPara>
          }
        />
        {/* La configuración del local (P-34) y el link de la pantalla del salón (HU-17). */}
        <Route path="configuracion" element={<SoloPara roles={SOLO_ADMIN}><ConfiguracionAdmin /></SoloPara>} />
        <Route path="*" element={<InicioDelAdmin />} />
      </Route>
      <Route path="/plataforma/*" element={<Pendiente titulo="Super Admin" />} />
      <Route path="*" element={<Pendiente titulo="Chit&Go" />} />
    </Routes>
  )
}
