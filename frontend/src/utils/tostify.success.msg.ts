import {toast} from "react-toastify";



export const handleSuccessTostify = (msg:string) => {
    toast.success(msg, {
        position: 'top-right',
        // pauseOnHover,
        autoClose: 3000        // ms before it disappears
    })
}