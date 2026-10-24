/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/ToastProvider';
import { AuthProvider } from './context/AuthContext';
import { LoginModal } from './components/LoginModal';

// Cada módulo se carga solo cuando el usuario entra (la app inicia más rápido).
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Talento = lazy(() => import('./pages/Talento'));
const CadenaValor = lazy(() => import('./pages/CadenaValor'));
const Puestos = lazy(() => import('./pages/Puestos'));
const Personas = lazy(() => import('./pages/Personas'));
const Reclutamiento = lazy(() => import('./pages/Reclutamiento'));
const Desempeno = lazy(() => import('./pages/Desempeno'));
const Capacitacion = lazy(() => import('./pages/Capacitacion'));
const Reportes = lazy(() => import('./pages/Reportes'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <LoginModal />
        <Routes>
          <Route path="login" element={<Login />} />
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="talento" element={<Talento />} />
            <Route path="cadena-valor" element={<CadenaValor />} />
            <Route path="puestos/:jobCode?" element={<Puestos />} />
            <Route path="personas/:employeeId?/:action?" element={<Personas />} />
            <Route path="reclutamiento/:jobCode?" element={<Reclutamiento />} />
            <Route path="desempeno" element={<Desempeno />} />
            <Route path="capacitacion" element={<Capacitacion />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
