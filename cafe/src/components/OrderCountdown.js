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
  const [elapsed, setElapsed] = useState(0); // เวลาที่ผ่านไปจริง
  const [key, setKey] = useState(0); // สำหรับรีเซ็ต timer
  const [finished, setFinished] = useState(false); // ป้องกัน onFinish ซ้ำ

  useEffect(() => {
    if (expandedItems.length === 0) return;
    if (seconds <= 0) {
      if (currentIdx < expandedItems.length - 1) {
        setCurrentIdx(currentIdx + 1);
        setSeconds(expandedItems[currentIdx + 1].duration || 0);
        setElapsed(0); // reset elapsed
        setKey(prev => prev + 1);
      } else {
        if (!finished && onFinish) {
          setFinished(true);
          onFinish();
        }
      }
    }
  }, [seconds, currentIdx, expandedItems, onFinish, finished]);

  const currentItem = expandedItems[currentIdx];
  // ปุ่ม Cancel ทำงานได้เฉพาะ 3 วินาทีแรกของเมนูแรกเท่านั้น
  const cancelDisabled = currentIdx > 0 || elapsed > 3;

  return (
    <div className="cart-popup-overlay">
      <div className="cart-popup countdown-popup">
        <h2 className="countdown-title">Preparing: {currentItem?.name || 'Order'}</h2>
        <div className="countdown-timer-wrap">
          <CountdownCircleTimer
            key={key}
            isPlaying
            duration={seconds}
            colors={["#5b3a23", "#8b5e3c", "#b8865f"]}
            trailColor="#e9dacb"
            size={120}
            strokeWidth={10}
            onComplete={() => {
              setSeconds(0);
              return { shouldRepeat: false };
            }}
            onUpdate={remainingTime => {
              setElapsed(expandedItems[0]?.duration - remainingTime);
            }}
          >
            {({ remainingTime }) => (
              <span className="countdown-time">{remainingTime} s</span>
            )}
          </CountdownCircleTimer>
        </div>
        <div className="countdown-step">
          {currentIdx + 1} / {expandedItems.length}
        </div>
        <button
          className="cart-close-button"
          onClick={onCancel}
          disabled={cancelDisabled}
        >Cancel</button>
      </div>
    </div>
  );
}

export default OrderCountdown;
