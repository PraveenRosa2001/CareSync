// import React, { useState, useEffect } from "react";
// import { Link as ScrollLink } from "react-scroll";
// import { Link, useNavigate } from "react-router-dom";
// import { FaCaretDown, FaBars } from 'react-icons/fa';
// import image from '../assets/Logo_Original.png';
// import '../styles/navbar.css';

// export default function Navbar() {
//     const [menuOpen, setMenuOpen] = useState(false);
//     const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//     const [initials, setInitials] = useState('');
//     const navigate = useNavigate();

//     useEffect(() => {
//         const email = localStorage.getItem('Email');

//         const Name=localStorage.getItem('Name');

//         // if (email) {
//         //     const extractInitials = (email) => {
//         //         const nameParts = email.split('@')[0];
//         //         return nameParts[0] + nameParts[1];
//         //     };
//         //     setInitials(extractInitials(email));
//         // }

//         if (Name) {
//         const extractInitials = (name) => {
//             return name.slice(0, 2); // Extracts the first two letters
//         };
//         setInitials(extractInitials(Name));
//     }
//     }, []);

//     const toggleMenu = () => {
//         setMenuOpen(!menuOpen);
//     };

//     const toggleDropdown = () => {
//         setIsDropdownOpen(!isDropdownOpen);
//     };

//     const handleLogout = () => {
//         localStorage.removeItem('Token');
//         localStorage.removeItem('email'); 
//         navigate('/');
//     };

//     return (
//         <nav className="navbar">
//             <div className="navbar-container">
//                 <div className="navbar-logo">
//                     <img src={image} alt="Logo" />
//                 </div>

//                 <div className="mobile-menu-icon" onClick={toggleMenu}>
//                     <FaBars />
//                 </div>

//                 <ul className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
//                     <li>
//                         <ScrollLink to="home-section" smooth={true} duration={500} onClick={toggleMenu}>
//                             Home
//                         </ScrollLink>
//                     </li>
//                     <li>
//                         <ScrollLink to="services-section" smooth={true} duration={500} onClick={toggleMenu}>
//                             Services
//                         </ScrollLink>
//                     </li>

//                     <li>
//                         <Link to="/medical-history"> Medical history</Link>
//                     </li>
//                     {/* <li>
//                         <Link to="/register-user">User registration</Link>
//                     </li> */}

//                 </ul>

//                 <div className="navbar-profile">
//                     <div className="profile-initials" onClick={toggleDropdown}>
//                         <span>{initials.toUpperCase()}</span>
//                         <FaCaretDown
//                             size={20}
//                             className={`dropdown-icon ${isDropdownOpen ? 'open' : ''}`}
//                         />
//                     </div>


//                     {isDropdownOpen && (
//                         <div className="dropdown-menu">
//                             <Link to="/profile">Profile</Link>
//                             <button onClick={handleLogout} className="logout-button">Logout</button>
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </nav>
//     );
// }




// import React, { useState } from "react";
// import { Link as ScrollLink } from "react-scroll";
// import { Link, useNavigate } from "react-router-dom";
// import { FaUserCircle, FaCaretDown, FaBars } from 'react-icons/fa';
// import image from '../assets/Logo_Original.png';
// import '../styles/navbar.css';

// export default function Navbar() {
//     const [menuOpen, setMenuOpen] = useState(false);
//     const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//     const navigate = useNavigate();

//     const toggleMenu = () => {
//         setMenuOpen(!menuOpen);
//     };

//     const toggleDropdown = () => {
//         setIsDropdownOpen(!isDropdownOpen);
//     };

//     const handleLogout = () => {
//         localStorage.removeItem('Token');
//         navigate('/');
//     };

//     return (
//         <nav className="navbar">
//             <div className="navbar-container">
//                 {/* Left-aligned logo */}
//                 <div className="navbar-logo">
//                     <img src={image} alt="Logo" />
//                 </div>

//                 {/* Mobile menu icon */}
//                 <div className="mobile-menu-icon" onClick={toggleMenu}>
//                     <FaBars />
//                 </div>

//                 {/* Centered menu items */}
//                 <ul className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
//                     <li>
//                         <ScrollLink to="home-section" smooth={true} duration={500} onClick={toggleMenu}>
//                             Home
//                         </ScrollLink>
//                     </li>
//                     <li>
//                         <ScrollLink to="services-section" smooth={true} duration={500} onClick={toggleMenu}>
//                             Services
//                         </ScrollLink>
//                     </li>
//                     <li>
//                         <Link to="/register-user">User Registration</Link>
//                     </li>
//                     <li>
//                         <Link to="/medical-history">Medical Records</Link>
//                     </li>
//                 </ul>

//                 {/* Right-aligned profile icon */}
//                 <div className="navbar-profile">
//                     <div className="profile-icon" onClick={toggleDropdown}>
//                         <FaUserCircle size={30} />
//                         <FaCaretDown size={20} className="dropdown-icon" />
//                     </div>
//                     {isDropdownOpen && (
//                         <div className="dropdown-menu">
//                             <Link to="/profile">Profile</Link>
//                             <button onClick={handleLogout} className="logout-button">Logout</button>
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </nav>
//     );
// }

import { useState, useEffect } from "react";
import { Link as ScrollLink } from "react-scroll";
import { Link, useNavigate } from "react-router-dom";
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Menu,
    MenuItem,
    Avatar,
    Box,
    Divider,
    ListItemIcon,
    useMediaQuery,
    useTheme,
    Drawer,
    List,
    ListItem,
    ListItemText,
    Collapse,
    Container,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControlLabel,
    Checkbox,
    Card,
    CardContent,
} from "@mui/material";
import {
    Menu as MenuIcon,
    ArrowDropDown,
    Home,
    MedicalServices,
    History,
    Person,
    ExitToApp,
    SwitchAccount as SwitchAccountIcon,
} from "@mui/icons-material";
import axios from "axios";
import logo from '../assets/Logo_Original.png';

export default function Navbar() {
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [initials, setInitials] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [openSubMenu, setOpenSubMenu] = useState(false);
    const [switchAccountDialog, setSwitchAccountDialog] = useState(false);
    const [accountList, setAccountList] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);

    useEffect(() => {
        const Name = localStorage.getItem('Name');
        if (Name) {
            const extractInitials = (name) => {
                return name.slice(0, 2);
            };
            setInitials(extractInitials(Name));
        }

        const handleScroll = () => {
            const isScrolled = window.scrollY > 10;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [scrolled]);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('Token');
        localStorage.removeItem('Email');
        navigate('/');
        handleMenuClose();
    };

    const handleSubMenuToggle = () => {
        setOpenSubMenu(!openSubMenu);
    };

    const handleSwitchAccount = async () => {
        try {
            const contact = localStorage.getItem('Contact');
            if (!contact) {
                throw new Error('No contact information found');
            }

            const response = await axios.post(
                `${process.env.REACT_APP_API_BASE_URL}/AppoinmentLogin/userlists`,
                { contact }
            );

            if (response.data.length === 0) {
                throw new Error('No other accounts found for this mobile number');
            }
            setAccountList(response.data);
            setSwitchAccountDialog(true);
            handleMenuClose();
        } catch (error) {
        }
    };

    const drawer = (
        <Box sx={{ width: 250, padding: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <img src={logo} alt="Logo" style={{ height: 50 }} />
            </Box>
            <Divider />
            <List>
                <ListItem
                    button
                    component={ScrollLink}
                    to="home-section"
                    smooth={true}
                    duration={500}
                    onClick={handleDrawerToggle}
                    sx={{
                        '&:hover': {
                            backgroundColor: theme.palette.primary.main,
                            color: '#fff',
                            '& .MuiListItemIcon-root': {
                                color: '#fff'
                            }
                        }
                    }}
                >
                    <ListItemIcon><Home /></ListItemIcon>
                    <ListItemText primary="Home" />
                </ListItem>

                <ListItem
                    button
                    component={ScrollLink}
                    to="services-section"
                    smooth={true}
                    duration={500}
                    onClick={handleDrawerToggle}
                    sx={{
                        '&:hover': {
                            backgroundColor: theme.palette.primary.main,
                            color: '#fff',
                            '& .MuiListItemIcon-root': {
                                color: '#fff'
                            }
                        }
                    }}
                >
                    <ListItemIcon><MedicalServices /></ListItemIcon>
                    <ListItemText primary="Services" />
                </ListItem>

                <ListItem
                    button
                    component={Link}
                    to="/medical-history"
                    onClick={handleDrawerToggle}
                    sx={{
                        '&:hover': {
                            backgroundColor: theme.palette.primary.main,
                            color: '#fff',
                            '& .MuiListItemIcon-root': {
                                color: '#fff'
                            }
                        }
                    }}
                >
                    <ListItemIcon><History /></ListItemIcon>
                    <ListItemText primary="Medical History" />
                </ListItem>

                <ListItem button onClick={handleSubMenuToggle}>
                    <ListItemIcon>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                            {initials.toUpperCase()}
                        </Avatar>
                    </ListItemIcon>
                    <ListItemText primary="Profile" />
                    {openSubMenu ? <ArrowDropDown /> : <ArrowDropDown style={{ transform: 'rotate(-90deg)' }} />}
                </ListItem>

                <Collapse in={openSubMenu} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItem
                            button
                            sx={{ pl: 4 }}
                            component={Link}
                            to="/profile"
                            onClick={handleDrawerToggle}
                        >
                            <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                            <ListItemText primary="My Profile" />
                        </ListItem>
                        <ListItem
                            button
                            sx={{ pl: 4 }}
                            onClick={() => {
                                handleDrawerToggle();
                                handleLogout();
                            }}
                        >
                            <ListItemIcon><ExitToApp fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItem>
                        <ListItem
                                onClick={handleSwitchAccount}
                                button
                            sx={{ pl: 4 }}
                            component={Link}
                            >
                                <ListItemIcon>
                                    <SwitchAccountIcon fontSize="small" />
                                </ListItemIcon>
                                Switch Account
                            </ListItem>
                    </List>
                </Collapse>
            </List>
        </Box>
    );

    return (
        <>
            <AppBar
                position="fixed"
                sx={{
                    backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
                    color: scrolled ? theme.palette.text.primary : '#fff',
                    boxShadow: scrolled ? theme.shadows[4] : 'none',
                    transition: 'all 0.3s ease',
                    backdropFilter: scrolled ? 'blur(10px)' : 'none',
                    mt: 2,
                    borderBottom: scrolled ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                <Container maxWidth="lg">
                    <Toolbar sx={{
                        justifyContent: 'space-between',
                        padding: '8px 0 !important'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                edge="start"
                                onClick={handleDrawerToggle}
                                sx={{ mr: 2, display: { md: 'none' } }}
                            >
                                <MenuIcon />
                            </IconButton>

                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                '& img': {
                                    filter: scrolled ? 'none' : 'brightness(0) invert(1)',
                                    transition: 'filter 0.3s ease'
                                }
                            }}>
                                <img src={logo} alt="Logo" style={{ height: 40, marginRight: 10 }} />
                                {/* <Typography 
                                    variant="h6" 
                                    component="div" 
                                    sx={{ 
                                        fontWeight: 600,
                                        color: scrolled ? theme.palette.text.primary : '#fff'
                                    }}
                                >
                                    CareSync
                                </Typography> */}
                            </Box>
                        </Box>

                        {/* Desktop Navigation */}
                        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                            <Box
                                component={ScrollLink}
                                to="home-section"
                                smooth={true}
                                duration={500}
                                sx={{
                                    color: scrolled ? theme.palette.text.primary : '#fff',
                                    textDecoration: 'none',
                                    padding: '8px 16px',
                                    borderRadius: 4,
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: theme.palette.primary.main,
                                        color: '#fff'
                                    }
                                }}
                            >
                                <Typography sx={{ fontWeight: 500 }}>Home</Typography>
                            </Box>

                            <Box
                                component={ScrollLink}
                                to="services-section"
                                smooth={true}
                                duration={500}
                                sx={{
                                    color: scrolled ? theme.palette.text.primary : '#fff',
                                    textDecoration: 'none',
                                    padding: '8px 16px',
                                    borderRadius: 4,
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: theme.palette.primary.main,
                                        color: '#fff'
                                    }
                                }}
                            >
                                <Typography sx={{ fontWeight: 500 }}>Services</Typography>
                            </Box>

                            <Box
                                component={Link}
                                to="/medical-history"
                                sx={{
                                    color: scrolled ? theme.palette.text.primary : '#fff',
                                    textDecoration: 'none',
                                    padding: '8px 16px',
                                    borderRadius: 4,
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: theme.palette.primary.main,
                                        color: '#fff'
                                    }
                                }}
                            >
                                <Typography sx={{ fontWeight: 500 }}>Medical History</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton
                                onClick={handleMenuOpen}
                                sx={{ p: 0 }}
                            >
                                <Avatar sx={{
                                    bgcolor: scrolled ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.2)',
                                    color: scrolled ? '#fff' : '#fff',
                                    width: 40,
                                    height: 40,
                                    fontSize: 14,
                                    fontWeight: 'bold',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        bgcolor: theme.palette.primary.dark
                                    }
                                }}>
                                    {initials.toUpperCase()}
                                </Avatar>
                            </IconButton>
                        </Box>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                            PaperProps={{
                                elevation: 3,
                                sx: {
                                    overflow: 'visible',
                                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                    mt: 1.5,
                                    '& .MuiAvatar-root': {
                                        width: 32,
                                        height: 32,
                                        ml: -0.5,
                                        mr: 1,
                                    },
                                    '&:before': {
                                        content: '""',
                                        display: 'block',
                                        position: 'absolute',
                                        top: 0,
                                        right: 14,
                                        width: 10,
                                        height: 10,
                                        bgcolor: 'background.paper',
                                        transform: 'translateY(-50%) rotate(45deg)',
                                        zIndex: 0,
                                    },
                                },
                            }}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        >
                            <MenuItem
                                component={Link}
                                to="/profile"
                                onClick={handleMenuClose}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: theme.palette.primary.light,
                                        color: theme.palette.primary.contrastText
                                    }
                                }}
                            >
                                <ListItemIcon>
                                    <Person fontSize="small" />
                                </ListItemIcon>
                                My Profile
                            </MenuItem>
                            {/* <Divider /> */}
                            <Divider sx={{ borderBottomWidth: 2 }} />
                            <MenuItem
                                onClick={handleSwitchAccount}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: theme.palette.primary.light,
                                        color: theme.palette.primary.contrastText
                                    }
                                }}
                            >
                                <ListItemIcon>
                                    <SwitchAccountIcon fontSize="small" />
                                </ListItemIcon>
                                Switch Account
                            </MenuItem>
                            <MenuItem
                                onClick={handleLogout}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: theme.palette.error.light,
                                        color: theme.palette.error.contrastText
                                    }
                                }}
                            >
                                <ListItemIcon>
                                    <ExitToApp fontSize="small" />
                                </ListItemIcon>
                                Logout
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true,
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: 250,
                        backgroundColor: theme.palette.background.paper
                    },
                }}
            >
                {drawer}
            </Drawer>

            {/* Add margin top to the main content */}
            {/* <Toolbar sx={{ mt: 8 }} /> */}

            <Dialog
                open={switchAccountDialog}
                onClose={() => setSwitchAccountDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle
                    sx={{
                        bgcolor: "#f5f5f5",
                        borderBottom: 1,
                        borderColor: "divider",
                    }}
                >
                    <Typography variant="h6">Switch Account</Typography>
                    <Typography variant="body2" color="textSecondary">
                        Select a different profile to switch to
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    {accountList.length > 0 ? (
                        <Box>
                            {accountList.map((account, index) => (
                                <Card
                                    key={index}
                                    variant="outlined"
                                    sx={{
                                        m: 2,
                                        cursor: "pointer",
                                        borderColor:
                                            selectedAccount?.MPD_PATIENT_CODE === account.MPD_PATIENT_CODE
                                                ? "primary.main"
                                                : "divider",
                                        boxShadow:
                                            selectedAccount?.MPD_PATIENT_CODE === account.MPD_PATIENT_CODE
                                                ? "0 0 0 2px #1976d2"
                                                : "none",
                                        transition: "all 0.2s ease-in-out",
                                    }}
                                    onClick={() => setSelectedAccount(account)}
                                >
                                    <CardContent>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={selectedAccount?.MPD_PATIENT_CODE === account.MPD_PATIENT_CODE}
                                                    onChange={() =>
                                                        setSelectedAccount(
                                                            selectedAccount?.MPD_PATIENT_CODE === account.MPD_PATIENT_CODE
                                                                ? null
                                                                : account
                                                        )
                                                    }
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography variant="subtitle1">
                                                        {account.MPD_PATIENT_NAME}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {account.MPD_MOBILE_NO}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    ) : (
                        <Typography variant="body2" sx={{ p: 3 }}>
                            No other accounts found for this mobile number.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setSwitchAccountDialog(false)} variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={async () => {
                            if (!selectedAccount) return;

                            try {
                                const response = await axios.post(
                                    `${process.env.REACT_APP_API_BASE_URL}/AppoinmentLogin/patient-login-api`,
                                    { patientcode: selectedAccount.MPD_PATIENT_CODE }
                                );
                                localStorage.setItem("Token", response.data.Token);
                                localStorage.setItem("Email", response.data.Email);
                                localStorage.setItem("PatientCode", selectedAccount.MPD_PATIENT_CODE);
                                localStorage.setItem("Name", selectedAccount.MPD_PATIENT_NAME);
                                localStorage.setItem("Contact", selectedAccount.MPD_MOBILE_NO);
                                localStorage.setItem("Role", response.data.Role);

                                setSwitchAccountDialog(false);
                                window.location.reload();
                            } catch (error) {
                            }
                        }}
                        variant="contained"
                        disabled={!selectedAccount}
                    >
                        Switch
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}