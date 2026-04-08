import React from 'react';

function SubtypeButtons({ subtypes, onSelect, selectedSubtype, isSubtypeDisabled }) {
  if (!subtypes || subtypes.length === 0) return null;
  return (
    <div className="subtype-buttons">
      {subtypes.map(st => (
        (() => {
          const disabledByStock = isSubtypeDisabled ? isSubtypeDisabled(st) : false;
          const isSelected = selectedSubtype === st.subtype_id;
          return (
        <button
          key={st.subtype_id}
          className={`subtype-button ${isSelected ? 'is-selected' : ''} ${disabledByStock ? 'is-disabled' : ''}`}
          onClick={() => onSelect(st)}
          disabled={isSelected || disabledByStock}
          title={disabledByStock ? 'วัตถุดิบไม่พอ/หมด' : ''}
        >
          {st.subtype_name_th || st.subtype_name_en}
        </button>
          );
        })()
      ))}
    </div>
  );
}

export default SubtypeButtons;
