
import { createBrowserRouter, createRoutesFromElements, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import Home from '../pages/Home'
import CreatePoll from '../pages/CreatePoll.tsx'
import PollResult from '../pages/PollResult'
import PollVote from '../pages/PollVote'
import NotFound from '../pages/NotFound'
import ProtectedRoutes from "./ProtectedRoutes.tsx";
import GuestRoutes from "./GuestRoutes.tsx";



const router = createBrowserRouter(
    createRoutesFromElements(
        <Route>

            <Route element={<ProtectedRoutes />}>
                <Route path='/home' element={<Home />} />
                <Route path='/poll/createPoll' element={<CreatePoll />} />
            </Route>

            <Route element={<GuestRoutes />}>
                <Route path='/login' element={<Login />} />
                <Route path='/signup' element={<Signup />} />
            </Route>

            {/* Open Routes */}
            <Route path="/" element={<Navigate to="/login"/>}  />
            <Route path='/poll/:slug/pollResult' element={ <PollResult/> }/>
            <Route path='/poll/:slug/pollVote' element={ <PollVote/> }/>

            {/*catch-all route*/}
            {/*Add this as the last route, so a mistyped URL shows your message instead of React Router's error screen:*/}
            <Route path='*' element={<NotFound />} />



        </Route>

    )
)


export default router

