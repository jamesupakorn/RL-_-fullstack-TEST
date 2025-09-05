import React, { useEffect, useState } from 'react';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

/**
 * OrderCountdown - popup แสดง countdown ทีละเมนู
 * @param {Array} items - array ของสินค้าใน order (แต่ละ item มี duration, name, qty)
 * @param {Function} onFinish - callback เมื่อ countdown จบ
 * @param {Function} onCancel - callback เมื่อกดปุ่มยกเลิก
 */
function OrderCountdown({ items = [], onFinish, onCancel }) {
  // สร้าง array ของแต่ละเมนูตาม qty
  const expandedItems = items.flatMap(item => Array(item.qty).fill(item));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [seconds, setSeconds] = useState(expandedItems[0]?.duration || 0);
  const [key, setKey] = useState(0); // สำหรับรีเซ็ต timer

  useEffect(() => {
    if (expandedItems.length === 0) return;
    if (seconds <= 0) {
      if (currentIdx < expandedItems.length - 1) {
        // ไปเมนูถัดไป
        setCurrentIdx(currentIdx + 1);
        setSeconds(expandedItems[currentIdx + 1].duration || 0);
        setKey(prev => prev + 1); // รีเซ็ต timer
      } else {
        // จบทั้งหมด
        if (onFinish) onFinish();
      }
      return;
    }
    // ไม่ต้อง setTimeout แล้ว ใช้ timer จากไลบรารี
  }, [seconds, currentIdx, expandedItems, onFinish]);

  const currentItem = expandedItems[currentIdx];
  // ปุ่ม cancel disable หลัง 3 วินาทีแรกของแต่ละเมนู
  // ปุ่ม cancel disable หลัง 3 วินาทีแรกของเมนูแรก แล้ว disable ยาวจนจบ
  const cancelDisabled = currentIdx > 0 || seconds < (expandedItems[0]?.duration || 0) - 3;

  return (
    <div className="cart-popup-overlay">
      <div className="cart-popup" style={{ textAlign: 'center' }}>
        <h2>Preparing: {currentItem?.name || 'Order'}</h2>
        <div style={{ margin: '24px 0' }}>
          <CountdownCircleTimer
            key={key}
            isPlaying
            duration={seconds}
            colors={["#27ae60", "#f7b731", "#e74c3c"]}
            trailColor="#eee"
            size={120}
            strokeWidth={10}
            onComplete={() => {
              setSeconds(0);
              return { shouldRepeat: false };
            }}
          >
            {({ remainingTime }) => (
              <span style={{ fontSize: '2rem', color: '#333' }}>{remainingTime} s</span>
            )}
          </CountdownCircleTimer>
        </div>
        <div style={{ marginBottom: 8, color: '#888' }}>
          {currentIdx + 1} / {expandedItems.length}
        </div>
        <button
          className="cart-close-button"
          style={{ marginTop: 16 }}
          onClick={onCancel}
          disabled={cancelDisabled}
        >Cancel</button>
      </div>
    </div>
  );
}

export default OrderCountdown;
