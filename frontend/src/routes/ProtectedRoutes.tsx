import {useEffect, useState} from "react";
import {api} from "../api/client.ts";
import {Navigate, Outlet} from "react-router-dom";

function ProtectedRoutes() {

    type AllowedStrings = 'Loading' | 'Authenticated' | 'Guest';
    const [status, setStatus] = useState<AllowedStrings>("Loading");

    useEffect(() => {
        async function fetchUser(){
            try {
                const user = await api.get("auth/get-me");
                if (user) setStatus("Authenticated");
            }
            catch{
                setStatus("Guest");
            }
        }
        fetchUser();

    },[])

    //<Outlet /> means "render whichever child route matched here". That's what lets one guard wrap several pages
    if (status === "Loading") return <div>⏳ Loading...</div>
    // replace on <Navigate> stops the protected URL going into history, so the back button doesn't bounce the user straight back into the redirect.
    if (status === "Guest") return <Navigate to="/login" replace />
    return <Outlet />
}

export default ProtectedRoutes;