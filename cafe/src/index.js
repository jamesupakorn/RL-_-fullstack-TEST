
import React from 'react'; // นำเข้า React
import ReactDOM from 'react-dom/client'; // นำเข้า ReactDOM สำหรับ render
import './index.css'; // นำเข้า CSS หลัก
import MainMenu from './components/MainMenu'; // นำเข้า MainMenu component
import reportWebVitals from './reportWebVitals'; // นำเข้า function สำหรับวัด performance

const root = ReactDOM.createRoot(document.getElementById('root')); // สร้าง root สำหรับ render React
root.render(
  <React.StrictMode>
    <MainMenu /> {/* render MainMenu component */}
  </React.StrictMode>
);

// ส่วนนี้สำหรับวัด performance (ไม่จำเป็นต้องแก้ไข)
reportWebVitals();
