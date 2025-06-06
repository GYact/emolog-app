import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Home from '../pages/Home';
import Login from '../pages/Login';
import SignUp from '../pages/SignUp';
import PartnerConnect from '../pages/PartnerConnect';
import CreateHighlight from '../pages/CreateHighlight';

const AppRouter = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // or a spinner component
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              userProfile?.partnerId ? (
                <Home />
              ) : (
                <Navigate to="/partner-connect" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/create-highlight"
          element={
            user && userProfile?.partnerId ? (
              <CreateHighlight />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/partner-connect"
          element={
            user ? (
              !userProfile?.partnerId ? (
                <PartnerConnect />
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/signup"
          element={!user ? <SignUp /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
};

export default AppRouter; 