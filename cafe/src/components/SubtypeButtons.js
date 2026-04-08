import React from 'react';

function SubtypeButtons({ subtypes, onSelect, selectedSubtype, isSubtypeDisabled }) {
  if (!subtypes || subtypes.length === 0) return null;
  return (
    <div>
      {subtypes.map(st => (
        (() => {
          const disabledByStock = isSubtypeDisabled ? isSubtypeDisabled(st) : false;
          return (
        <button
          key={st.subtype_id}
          onClick={() => onSelect(st)}
          disabled={selectedSubtype === st.subtype_id || disabledByStock}
          style={disabledByStock ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
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
