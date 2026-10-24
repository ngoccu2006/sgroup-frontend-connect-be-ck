import {Navigate, Outlet} from "react-router-dom";
import { getToken, getUser } from "../api/client";

export default function ProtectedRoute({roles}){
  const token = getToken();
  const user = getUser();

  if(!token || !user) return <Navigate to="/login" replace />;
  if(roles && !roles.includes(user.role)) return <Navigate to ="/403" replace />;

  return <Outlet/>;
}

