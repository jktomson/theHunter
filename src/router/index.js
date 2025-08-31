import Login from "../pages/Login/login";
import Home from "../pages/Home";
import { createBrowserRouter } from "react-router-dom";
import Trophy from "../pages/Trophy/trophy";
import Landscape from "../pages/Landscape/landscape";
import NotFound from "../pages/NotFound/notfound";
import Register from "../pages/Register/register";
import UserPage from "../pages/UserPage/userpage";
import ProtectedRoute from "../components/ProtectedRoute";

const router = createBrowserRouter([
    {
        path: '/',
        element: <Home></Home>
    },
    {
        path: '/register',
        element: <Register></Register>
    },
    {
        path: '/login',
        element: <Login></Login>
    },
    {
        path: '/user',
        element: (
            <ProtectedRoute>
                <UserPage></UserPage>
            </ProtectedRoute>
        )
    },
    {
        path: '/home',
        element: <Home></Home>,
        children: [
            {
                index: true,
                element: <Landscape></Landscape>
            },
            {
                path: 'trophy',
                element: <Trophy></Trophy>
            }
        ]
    },
    {
        path: '*',
        element: <NotFound></NotFound>
    }
])

export default router