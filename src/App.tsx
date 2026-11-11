import { Route, Routes, Navigate } from 'react-router-dom'
import Pendiente from './compartido/ui/Pendiente'
import RutaProtegida from './compartido/sesion/RutaProtegida'
import ConCredencialPropia from './compartido/sesion/ConCredencialPropia'
import CambiarContrasena from './roles/acceso/paginas/CambiarContrasena'
import ElegirPin from './roles/acceso/paginas/ElegirPin'
import LoginAdmin from './roles/acceso/paginas/LoginAdmin'
import LoginPin from './roles/acceso/paginas/LoginPin'
import PantallaProvisoria from './roles/acceso/paginas/PantallaProvisoria'
import { PaginaMenuCliente } from './roles/cliente/paginas/PaginaMenuCliente'
import PaginaPedidoCliente from './roles/cliente/paginas/PaginaPedidoCliente'
import PaginaCuentaCliente from './roles/cliente/paginas/PaginaCuentaCliente'

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

// Rutas de Cocina
import ColaCocina from './roles/cocina/paginas/ColaCocina'

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
        <Route path="aprobados" element={<Pendiente titulo="Pedidos aprobados" />} />
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

      {/* Disponibilidad rápida del Admin (P-10c): sola, antes de /admin/*. El marco del Admin es de la ST-18. */}
      <Route
        path="/admin/disponibilidad"
        element={
          <RutaProtegida roles={['ADMIN']}>
            <ConCredencialPropia>
              <div className="min-h-dvh bg-fondo">
                <DisponibilidadRapida />
              </div>
            </ConCredencialPropia>
          </RutaProtegida>
        }
      />

      {/* Hasta que cada rol tenga sus pantallas: quién entró y "Cerrar sesión" */}
      <Route
        path="/admin/*"
        element={<RutaProtegida roles={['ADMIN', 'GERENTE_DUENO']}><PantallaProvisoria /></RutaProtegida>}
      />
      <Route path="/plataforma/*" element={<Pendiente titulo="Super Admin" />} />
      <Route path="*" element={<Pendiente titulo="Chit&Go" />} />
    </Routes>
  )
}
