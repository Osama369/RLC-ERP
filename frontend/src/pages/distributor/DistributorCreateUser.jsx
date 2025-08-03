import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { showLoading, hideLoading } from '../../redux/features/alertSlice';
import { toast } from 'react-toastify';
import UserForm from '../../components/UserForm';

const DistributorCreateUser = ({theme}) => {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleCreateUser = async (userData) => {
    try {
      setError('');
    //   dispatch(showLoading());

      // Get the token for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to create users');
        navigate('/login');
        return;
      }

      // Create the user using the distributor-specific endpoint
      const response = await axios.post('/api/v1/users/distributor-create-user', userData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

    //   dispatch(hideLoading());
      
      // Show success message and navigate back to user management
      toast.success('User created successfully!');
      navigate('/manage-users');
    } catch (error) {
      dispatch(hideLoading());
      const errorMessage = error.response?.data?.message || 'Failed to create user';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New User</h1>
        <p className="text-gray-600 mt-1">Add a new user to your account</p>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <UserForm 
        onSubmit={handleCreateUser}
        initialData={{
          // Generate a default dealer ID
          dealerId: Math.random().toString(36).substring(2, 10).toUpperCase()
        }}
        isEditing={false}
        theme={theme} // Pass the theme prop for styling
      />
    </div>
  );
};

export default DistributorCreateUser;