// src/components/RoleProtectedRoute.jsx
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { showLoading, hideLoading } from '../redux/features/alertSlice';
import axios from 'axios';
import { setUser } from '../redux/features/authSlice';

export default function RoleProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  
    if (!token) {
      return <Navigate to="/login" />;
    }
  
    try {
      const decodedToken = jwtDecode(token);
      
      if (allowedRoles.includes(decodedToken.role)) {
        return children;
      } else {
        alert("Access Denied: Insufficient Permissions");
        return <Navigate to="/" />; // Redirect to homepage or another page
      }
    } catch (error) {
      console.error("Invalid token", error);
      return <Navigate to="/login" />;
    }
}