import React, { useState, useRef, useEffect } from 'react';
import Logo_CS from '../../assets/img/Logo_CS.png';
import { Bell, LogOut, Users } from 'lucide-react';
import ImageUser from '../ImageUser/ImageUser';
import './Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useAuth } from '../../hooks/useAuth';

function Navbar({ role = "Marketing", showAdminLinks = true }) {
    const [showMenu, setShowMenu] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

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

    const handleNavigateAdmin = () => {
        setShowMenu(false);
        navigate('/admin');
    };

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

                <div className='user-menu-container' ref={menuRef}>
                    <div onClick={() => setShowMenu(!showMenu)}>
                        <ImageUser Initials={nameUser} name="Userimg" nameContainer="imgUser" />
                    </div>

                    {showMenu && (
                        <div className='profile-dropdown'>
                            {(effectiveRole === 'marketing' || role === 'Marketing' || effectiveRole === 'admin' || role === 'Admin') && (
                                <button onClick={handleNavigateAdmin} className='admin-btn'>
                                    <Users size={18} />
                                    <span>Administrar usuarios</span>
                                </button>
                            )}
                            <button onClick={logout} className='logout-btn'>
                                <LogOut size={18} />
                                <span>Cerrar sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showAdminLinks && (role === 'Admin' || role === 'Marketing' || effectiveRole === 'admin' || effectiveRole === 'marketing') && (
                <div className="nav-admin-links">
                    <Link to="/admin" className="nav-link">Administrar usuarios</Link>
                    <Link to="/requests" className="nav-link">Solicitudes</Link>
                </div>
            )}
        </>
    )
}
export default Navbar
