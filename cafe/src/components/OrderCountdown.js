import React, { useEffect, useState } from 'react';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

function OrderCountdown({ items = [], onFinish, onCancel }) {
  const expandedItems = items.flatMap(item => Array(item.qty).fill(item));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [seconds, setSeconds] = useState(expandedItems[0]?.duration || 0);
  const [elapsed, setElapsed] = useState(0);
  const [key, setKey] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (expandedItems.length === 0) return;
    if (seconds <= 0) {
      if (currentIdx < expandedItems.length - 1) {
        setCurrentIdx(currentIdx + 1);
        setSeconds(expandedItems[currentIdx + 1].duration || 0);
        setElapsed(0);
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
  // ยกเลิกได้เฉพาะ 3 วินาทีแรกของเมนูแรก
  const cancelDisabled = currentIdx > 0 || elapsed > 3;
  const cancelSecondsLeft = currentIdx === 0 ? Math.max(0, Math.ceil(3 - elapsed)) : 0;

  const cancelLabel = cancelDisabled
    ? 'ยกเลิกไม่ได้'
    : cancelSecondsLeft > 0
      ? `ยกเลิก (${cancelSecondsLeft}s)`
      : 'ยกเลิก';

  return (
    <div className="cart-popup-overlay">
      <div className="cart-popup countdown-popup">
        <h2 className="countdown-title">กำลังเตรียม: {currentItem?.name || 'ออเดอร์'}</h2>
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
              setElapsed((expandedItems[0]?.duration || 0) - remainingTime);
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
          className={`cart-close-button ${cancelDisabled ? 'cart-close-button--disabled' : ''}`}
          onClick={onCancel}
          disabled={cancelDisabled}
          title={cancelDisabled ? 'ยกเลิกออเดอร์ได้เฉพาะ 3 วินาทีแรกเท่านั้น' : 'ยกเลิกออเดอร์'}
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

export default OrderCountdown;
