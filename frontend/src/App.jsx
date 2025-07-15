import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Login from './pages/login';
import Register from './pages/Register';

import Dashboard from './pages/admin/Dashboard';
import AdminLayout from './pages/admin/AdminLayout';
import ManageUsers from './pages/admin/ManageUsers';
import CreateUser from './pages/admin/CreateUser';
import EditUser from './pages/admin/EditUser';

import { useSelector } from 'react-redux';
import Spinner from './components/Spinner';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import AdminLogin from './pages/admin/adminLogin';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminPublicRoute from './components/AdminPublicRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RoleBasedComponent from './components/RoleBasedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import DistributerUsers from './pages/distributor/DistributerUsers';
import DistributorCreateUser from './pages/distributor/DistributorCreateUser';

// this is the routing setup 
function App() {
  const { loading } = useSelector(state => state.alertSlice)
  return (

    <BrowserRouter>
    <ToastContainer position="top-right" autoClose={2000} /> {/* ✅ This line */}
      {loading ? (<Spinner />) : (<Routes>
        {/* homepage will be protected route  */}
        <Route path="/" element={
          <ProtectedRoute>
            <Homepage />
          </ProtectedRoute>

        }
        />


        {/* public routes */}
        <Route path='login' element={
          <PublicRoute>
            <Login />
          </PublicRoute>

        }></Route>

        <Route path='register' element={

          <PublicRoute>
            <Register />
          </PublicRoute>

        }></Route>

        {/* Distributor routes */}
        <Route path="/manage-users" element={
            <RoleProtectedRoute allowedRoles={['distributor']}>
              <DistributerUsers />
            </RoleProtectedRoute>
        } />
        <Route path="/create-user" element={
            <RoleProtectedRoute allowedRoles={['distributor']}>
              <DistributorCreateUser />
            </RoleProtectedRoute>
        } />
        <Route path="/edit-user/:id" element={
            <RoleProtectedRoute allowedRoles={['distributor']}>
              <EditUser />
            </RoleProtectedRoute>
        } />

        <Route path="/admin-login" element={
          <AdminPublicRoute>
            <AdminLogin />
          </AdminPublicRoute>
        } />

        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />  {/* Default to Dashboard */}
          <Route path="manage-users" element={<ManageUsers />} />
          <Route path="create-user" element={<CreateUser />} />
          <Route path="edit-user/:id" element={<EditUser />} />
        </Route>
      </Routes>


      )}

    </BrowserRouter>

  );
}

export default App;
