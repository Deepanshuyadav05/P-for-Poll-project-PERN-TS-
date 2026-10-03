
import { createBrowserRouter, createRoutesFromElements, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import Home from '../pages/Home'
import CreatePoll from '../pages/CreatePoll.tsx'
import PollResult from '../pages/PollResult'
import PollVote from '../pages/PollVote'



let router = createBrowserRouter(
    createRoutesFromElements(
        <Route>

            {/* Open Routes */}
            <Route path="/" element={<Navigate to="/login"/>}  />
            <Route path='/login' element={ <Login/>}/>
            <Route path='/signup' element={ <Signup/> }/>
            <Route path='/home' element={ <Home/> }/>
            <Route path='/poll/createPoll' element={ <CreatePoll/> }/>
            <Route path='/poll/:slug/pollResult' element={ <PollResult/> }/>
            <Route path='/poll/:slug/pollVote' element={ <PollVote/> }/>



        </Route>
    )
)


export default router

