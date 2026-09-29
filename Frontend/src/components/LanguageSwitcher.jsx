
// import React, { useEffect, useState } from "react";
// import {
//     Box,
//     IconButton,
//     Menu,
//     MenuItem,
//     Avatar,
//     Tooltip,
// } from "@mui/material";
// import TranslateIcon from "@mui/icons-material/Translate";

// const LanguageSwitcher = () => {
//     const [anchorEl, setAnchorEl] = useState(null);



//     // Load Google Translate
//     //   useEffect(() => {
//     //     if (!window.googleTranslateElementInit2) {
//     //       window.googleTranslateElementInit2 = () => {
//     //         new window.google.translate.TranslateElement(
//     //           {
//     //             pageLanguage: "en",
//     //             autoDisplay: false,
//     //           },
//     //           "google_translate_element2"
//     //         );
//     //       };

//     //       const script = document.createElement("script");
//     //       script.src =
//     //         "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2";
//     //       document.body.appendChild(script);
//     //     }
//     //   }, []);

//     useEffect(() => {
//         if (!window.googleTranslateElementInit2) {
//             window.googleTranslateElementInit2 = () => {
//                 new window.google.translate.TranslateElement(
//                     {
//                         pageLanguage: "en",
//                         autoDisplay: false,
//                     },
//                     "google_translate_element2"
//                 );
//             };

//             const script = document.createElement("script");
//             script.src =
//                 "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2";
//             document.body.appendChild(script);
//         }

//         const cleanupInterval = setInterval(() => {
//             const bannerFrame = document.querySelector(".goog-te-banner-frame");
//             const body = document.body;
//             if (bannerFrame) bannerFrame.style.display = "none";
//             if (body.style.top !== "0px") body.style.top = "0px";
//         }, 1000);

//         setTimeout(() => clearInterval(cleanupInterval), 10000);
//     }, []);


//     const doGTranslate = (langPair) => {
//         const lang = langPair.split("|")[1];
//         const sel = document.getElementsByTagName("select");
//         let teCombo = null;

//         for (let i = 0; i < sel.length; i++) {
//             if (sel[i].className.includes("goog-te-combo")) {
//                 teCombo = sel[i];
//                 break;
//             }
//         }

//         if (!teCombo || !teCombo.innerHTML.length) {
//             setTimeout(() => doGTranslate(langPair), 500);
//         } else {
//             teCombo.value = lang;
//             const evt = new Event("change");
//             teCombo.dispatchEvent(evt);
//         }
//     };

//     const handleOpenMenu = (event) => {
//         setAnchorEl(event.currentTarget);
//     };

//     const handleCloseMenu = () => {
//         setAnchorEl(null);
//     };

//     const handleLanguageChange = (lang) => {
//         doGTranslate(`en|${lang}`);
//         handleCloseMenu();
//     };

//     return (
//         <>
//             <div id="google_translate_element2" style={{ display: "none" }}></div>

//             <Box
//                 position="absolute"
//                 top={10}
//                 right={10}
//                 zIndex={2000}
//                 display="flex"
//                 alignItems="center"
//             >
//                 <Tooltip title="Change Language">
//                     <IconButton onClick={handleOpenMenu} size="large" color="black">
//                         <TranslateIcon fontSize="inherit" />
//                     </IconButton>
//                 </Tooltip>

//                 <Menu
//                     anchorEl={anchorEl}
//                     open={Boolean(anchorEl)}
//                     onClose={handleCloseMenu}
//                 >
//                     <MenuItem onClick={() => handleLanguageChange("en")}>
//                         <Avatar
//                             src="https://upload.wikimedia.org/wikipedia/commons/4/42/Flag_of_the_United_Kingdom.png"
//                             sx={{ width: 24, height: 24, mr: 1 }}
//                         />
//                         English
//                     </MenuItem>
//                     <MenuItem onClick={() => handleLanguageChange("si")}>
//                         <Avatar
//                             src="https://upload.wikimedia.org/wikipedia/commons/1/11/Flag_of_Sri_Lanka.svg"
//                             sx={{ width: 24, height: 24, mr: 1 }}
//                         />
//                         සිංහල
//                     </MenuItem>
//                     <MenuItem onClick={() => handleLanguageChange("ta")}>
//                         <Avatar
//                             src="https://upload.wikimedia.org/wikipedia/commons/b/bc/Flag_of_India.png"
//                             sx={{ width: 24, height: 16, mr: 1 }}
//                         />
//                         தமிழ்
//                     </MenuItem>
//                 </Menu>
//             </Box>
//         </>
//     );
// };

// export default LanguageSwitcher;
