import './ImageUser.css'
import { useState } from 'react';
import { CircleUser } from 'lucide-react';


function ImageUser(prop) {
    //console.log("Email response en ImageUser: " + prop.Initials);
    return (
        <div className={prop.nameContainer}>
            <div className={prop.name}>{prop.Initials}</div>
            {/* <div className='Userimg'>{prop.Initials}</div> */}
            {/* <CircleUser size={40} className='Userimg' /> */}
        </div>
    );
}
export default ImageUser;