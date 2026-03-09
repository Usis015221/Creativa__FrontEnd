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

    const rawRole = user?.role || user?.user_metadata?.role || '';
    const dbRole = String(rawRole).toLowerCase().trim();

    let nameUser = user?.firstName || "US";
    let lastName = user?.lastName || " ";
    nameUser = nameUser.substring(0, 1).toUpperCase();
    lastName = lastName.substring(0, 1).toUpperCase();
    let fullName = nameUser + lastName;

    let logoPath = '/';
    if (dbRole === 'designer' || dbRole === 'diseñador') {
        logoPath = '/designer';
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
                        {rawRole ? (rawRole.charAt(0).toUpperCase() + rawRole.slice(1)) : role}
                    </p>
                </div>

                <div className='user-menu-container' ref={menuRef}>
                    <div onClick={() => setShowMenu(!showMenu)}>
                        <ImageUser Initials={fullName} name="Userimg" nameContainer="imgUser" />
                    </div>

                    {showMenu && (
                        <div className='profile-dropdown'>
                            {(dbRole === 'marketing' || dbRole === 'admin') && (
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

            {showAdminLinks && (dbRole === 'admin' || dbRole === 'marketing') && (
                <div className="nav-admin-links">
                    <Link to="/admin" className="nav-link">Administrar usuarios</Link>
                    <Link to="/requests" className="nav-link">Solicitudes</Link>
                </div>
            )}
        </>
    )
}
export default Navbar
