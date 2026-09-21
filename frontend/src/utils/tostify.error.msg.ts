import {toast} from "react-toastify";



export const handleErrorTostify = (msg:string) => {
    toast.error(msg, {
        position: 'top-right',
        // pauseOnHover,
        autoClose: 3000        // ms before it disappears
    })
}