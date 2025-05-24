import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';  // this is for routing 
import Homepage from './pages/Homepage';
// import Vouchersheet from './components/VoucherSheet';
import Login from './pages/login';
import Register from './pages/Register';

import Dashboard from './pages/admin/Dashboard';
import AdminLayout from './pages/admin/AdminLayout';
import ManageUsers from './pages/admin/ManageUsers';
import { useSelector } from 'react-redux';
import Spinner from './components/Spinner';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import AdminLogin from './pages/admin/adminLogin';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminPublicRoute from './components/AdminPublicRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
        </Route>
      </Routes>


      )}

    </BrowserRouter>

  );
}

export default App;
