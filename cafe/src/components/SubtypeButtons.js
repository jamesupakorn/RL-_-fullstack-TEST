import React from 'react';

function SubtypeButtons({ subtypes, onSelect, selectedSubtype }) {
  if (!subtypes || subtypes.length === 0) return null;
  return (
    <div>
      {subtypes.map(st => (
        <button
          key={st.subtype_id}
          onClick={() => onSelect(st)}
          disabled={selectedSubtype === st.subtype_id}
        >
          {st.subtype_name}
        </button>
      ))}
    </div>
  );
}

export default SubtypeButtons;
