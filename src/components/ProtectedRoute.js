import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectIsAuthenticated } from '../store/userSlice';

const ProtectedRoute = ({ children }) => {
    const isLoggedIn = useSelector(selectIsAuthenticated);
    
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

export default ProtectedRoute;
