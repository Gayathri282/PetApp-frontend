import React, { useState } from 'react';
import { Plus, Tag, Check, Sparkles } from 'lucide-react';

export default function TagSuggestionsSelector({ tags = [], setTags, vendorProducts = [], inputId = 'custom-tag-input' }) {
  const [inputVal, setInputVal] = useState('');

  const DEFAULT_TAGS = ['guppy', 'betta', 'fish', 'dog', 'cat', 'bird', 'pure breed', 'on sale', 'accessories', 'food', 'toys', 'exotic', 'reptile', 'rabbit'];

  // Collect previous tags used across existing products/reels + localStorage
  const getSuggestedTags = () => {
    const fromProducts = (vendorProducts || []).flatMap((p) => p.tags || []);
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem('vendor_recent_tags') || '[]');
    } catch {}

    const combined = [...new Set([...stored, ...fromProducts, ...DEFAULT_TAGS])]
      .map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
      .filter(Boolean);

    return combined;
  };

  const suggestions = getSuggestedTags();

  const addTag = (tagToAdd) => {
    const clean = tagToAdd.trim().toLowerCase();
    if (!clean) return;
    if (!tags.includes(clean)) {
      const nextTags = [...tags, clean];
      setTags(nextTags);

      // Save to localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('vendor_recent_tags') || '[]');
        const updated = [...new Set([clean, ...stored])].slice(0, 40);
        localStorage.setItem('vendor_recent_tags', JSON.stringify(updated));
      } catch {}
    }
  };

  const removeTag = (tagToRemove) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputVal);
      setInputVal('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0D5148', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Tag style={{ width: 15, height: 15, color: '#0D5148' }} /> Product & Reel Tags
      </label>

      {/* Selected Tags Pills */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => removeTag(t)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'linear-gradient(135deg, #0D5148 0%, #177366 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(13, 81, 72, 0.25)',
              }}
            >
              #{t} <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>✕</span>
            </button>
          ))}
        </div>
      )}

      {/* Custom Tag Input + Add Button */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          id={inputId}
          className="input-field"
          placeholder="Add custom tag (e.g. albino, purebreed)..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ flex: 1, height: 38, fontSize: '0.85rem', background: '#FFFFFF' }}
        />
        <button
          type="button"
          className="btn-accent"
          style={{ padding: '0 16px', height: 38, fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          onClick={() => {
            addTag(inputVal);
            setInputVal('');
          }}
        >
          + Add Tag
        </button>
      </div>

      {/* Suggested Previous Tags Section */}
      {suggestions.length > 0 && (
        <div style={{ background: '#F4F9F6', borderRadius: 12, padding: 12, border: '1px solid #D2E0D9' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0D5148', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Sparkles style={{ width: 14, height: 14, color: '#D97706' }} /> Previously Used & Suggested Tags (Click to add):
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 110, overflowY: 'auto', scrollbarWidth: 'thin' }}>
            {suggestions.map((sTag) => {
              const isSelected = tags.includes(sTag);
              return (
                <button
                  key={sTag}
                  type="button"
                  onClick={() => (isSelected ? removeTag(sTag) : addTag(sTag))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 16,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: isSelected ? '1.5px solid #0D5148' : '1px solid #C4D6CD',
                    background: isSelected ? '#0D5148' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#2A3F3B',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSelected ? <Check style={{ width: 12, height: 12 }} /> : <Plus style={{ width: 12, height: 12, color: '#0D5148' }} />}
                  #{sTag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
