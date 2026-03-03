import React, { useState, useRef, useEffect } from 'react';
import Logo_CS from '../../assets/img/Logo_CS.png';
import { Bell, LogOut } from 'lucide-react';
import ImageUser from '../ImageUser/ImageUser';
import './Navbar.css';
import { Link } from 'react-router-dom';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useAuth } from '../../hooks/useAuth';

function Navbar({ role = "Marketing" }) {
    const [showMenu, setShowMenu] = useState(false);
    const { logout } = useAuth();

    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const rol = user?.role;
    //console.log("usuario en Navbar:", user.firstName);
    let nameUser = user?.firstName || "US";
    nameUser = nameUser.substring(0, 2).toUpperCase();

    const effectiveRole = (role || rol || '').toString().toLowerCase();
    let logoPath = '/';
    if (effectiveRole === 'designer' || effectiveRole === 'diseñador') {
        logoPath = '/designer';
    } else if (effectiveRole === 'admin') {
        logoPath = '/admin';
    } else {
        logoPath = '/';
    }

    const { isSubscribed } = usePushNotifications();

    return (
        <>
            <div className='Navbar'>
                <Link to={logoPath}>
                    <img className='Logo' src={Logo_CS} alt="Logo" />
                </Link>

                <div className='Notification'>
                    <Bell size={24} className={isSubscribed ? 'campana campana--active' : 'campana'} />
                    <p className='textNotification'>
                        {rol ? (rol.charAt(0).toUpperCase() + rol.slice(1)) : role}
                    </p>
                </div>

                <div className='user-menu-container' ref={menuRef} onClick={() => setShowMenu(!showMenu)}>
                    <ImageUser Initials={nameUser} name="Userimg" nameContainer="imgUser" />

                    {showMenu && (
                        <div className='profile-dropdown'>
                            <button onClick={logout} className='logout-btn'>
                                <LogOut size={18} />
                                <span>Cerrar sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {role === 'Admin' && (
                <div className="nav-admin-links">
                    <Link to="/admin" className="nav-link">Administrar usuarios</Link>
                    <Link to="/requests" className="nav-link">Solicitudes</Link>
                </div>
            )}
        </>
    )
}
export default Navbar
