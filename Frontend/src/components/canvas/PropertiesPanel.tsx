import { type CanvasElement, type CanvasState, type Tool } from '../../store/useCanvasStore';

interface PropertiesPanelProps {
  selectedElements: CanvasElement[];
  defaultStyle: CanvasState['defaultStyle'];
  onUpdateElements: (updates: { id: string; attrs: Partial<CanvasElement> }[]) => void;
  onUpdateDefaultStyle: (patch: Partial<CanvasState['defaultStyle']>) => void;
  theme: 'light' | 'dark';
  tool?: Tool;
}

const COLORS = ['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00', 'transparent'];
const BG_COLORS = ['transparent', '#ffc9c9', '#b2f2bb', '#a5d8ff', '#ffec99'];

export function PropertiesPanel({
  selectedElements,
  defaultStyle,
  onUpdateElements,
  onUpdateDefaultStyle,
  theme,
  tool,
}: PropertiesPanelProps) {
  const isDark = theme === 'dark';
  const bg = isDark ? '#232329' : '#ffffff';
  const border = isDark ? '#3a3a44' : '#e2e2e2';
  const text = isDark ? '#c5c5d2' : '#1e1e2e';

  // Determine current value to show (if multiple selected, might be mixed)
  const currentStroke = selectedElements.length > 0 ? selectedElements[0].strokeColor ?? defaultStyle.strokeColor : defaultStyle.strokeColor;
  const currentBg = selectedElements.length > 0 ? selectedElements[0].backgroundColor ?? defaultStyle.backgroundColor : defaultStyle.backgroundColor;
  const currentFillStyle = selectedElements.length > 0 ? selectedElements[0].fillStyle ?? defaultStyle.fillStyle : defaultStyle.fillStyle;
  const currentStrokeWidth = selectedElements.length > 0 ? selectedElements[0].strokeWidth ?? defaultStyle.strokeWidth : defaultStyle.strokeWidth;
  const currentRoughness = selectedElements.length > 0 ? selectedElements[0].roughness ?? defaultStyle.roughness : defaultStyle.roughness;
  const currentFontSize = selectedElements.length > 0 ? selectedElements[0].fontSize ?? defaultStyle.fontSize : defaultStyle.fontSize;
  const currentFontFamily = selectedElements.length > 0 ? selectedElements[0].fontFamily ?? defaultStyle.fontFamily : defaultStyle.fontFamily;

  const showTextProperties = tool === 'text' || selectedElements.some(el => el.type === 'text');

  const handleChange = <K extends keyof CanvasElement>(key: K, value: any) => {
    if (selectedElements.length > 0) {
      onUpdateElements(selectedElements.map((el) => ({ id: el.id, attrs: { [key]: value } })));
    }
    // Always update default style so next element has this property
    onUpdateDefaultStyle({ [key]: value });
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: isDark ? '#8b8b99' : '#868e96', marginBottom: 8, marginTop: 16 }}>
      {children}
    </div>
  );

  const ColorPicker = ({ label, options, value, onChange }: any) => (
    <div>
      <SectionTitle>{label}</SectionTitle>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((c: string) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            style={{
              width: 28, height: 28, borderRadius: 6,
              background: c === 'transparent' ? (isDark ? '#3a3a44' : '#f8f9fa') : c,
              border: `2px solid ${value === c ? '#6965db' : border}`,
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            {c === 'transparent' && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', width: 24, height: 2, background: '#fa5252', transform: 'translate(-50%, -50%) rotate(45deg)' }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const ButtonGroup = ({ label, options, value, onChange }: any) => (
    <div>
      <SectionTitle>{label}</SectionTitle>
      <div style={{ display: 'flex', gap: 4, background: isDark ? '#191920' : '#f1f3f5', padding: 4, borderRadius: 8 }}>
        {options.map((opt: any) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1, padding: '6px 8px', borderRadius: 6,
              border: 'none', background: value === opt.value ? (isDark ? '#3d3d4a' : '#ffffff') : 'transparent',
              color: text, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              boxShadow: value === opt.value ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const NumberInput = ({ label, value, onChange }: any) => (
    <div>
      <SectionTitle>{label}</SectionTitle>
      <input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))} 
        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: `1px solid ${border}`, background: isDark ? '#191920' : '#f1f3f5', color: text, outline: 'none' }}
      />
    </div>
  );

  const SelectInput = ({ label, value, onChange, options }: any) => (
    <div>
      <SectionTitle>{label}</SectionTitle>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: `1px solid ${border}`, background: isDark ? '#191920' : '#f1f3f5', color: text, outline: 'none' }}
      >
        {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );

  const toggleList = (type: 'bullet' | 'number') => {
    if (selectedElements.length > 0) {
      onUpdateElements(selectedElements.filter(el => el.type === 'text').map(el => {
        const lines = (el.text ?? '').split('\n');
        const isAlreadyList = lines.every(line => type === 'bullet' ? line.trim().startsWith('• ') : /^\d+\.\s/.test(line.trim()));
        
        const newText = lines.map((line, i) => {
          let clean = line.replace(/^(• |\d+\.\s)/, '');
          if (isAlreadyList) return clean; 
          return type === 'bullet' ? `• ${clean}` : `${i + 1}. ${clean}`;
        }).join('\n');
        
        return { id: el.id, attrs: { text: newText } };
      }));
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 60, left: 16, width: 240,
      background: bg, border: `1px solid ${border}`, borderRadius: 12,
      padding: '0 16px 16px', boxShadow: '0 4px 16px rgba(0,0,0,.08)',
      zIndex: 100, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto'
    }}>
      <ColorPicker label="Stroke" options={COLORS} value={currentStroke} onChange={(v: any) => handleChange('strokeColor', v)} />
      <ColorPicker label="Background" options={BG_COLORS} value={currentBg} onChange={(v: any) => handleChange('backgroundColor', v)} />

      <ButtonGroup
        label="Fill"
        value={currentFillStyle}
        onChange={(v: any) => handleChange('fillStyle', v)}
        options={[
          { label: 'Hachure', value: 'hachure' },
          { label: 'Cross', value: 'cross-hatch' },
          { label: 'Solid', value: 'solid' },
        ]}
      />

      <ButtonGroup
        label="Stroke Width"
        value={currentStrokeWidth}
        onChange={(v: any) => handleChange('strokeWidth', v)}
        options={[
          { label: 'Thin', value: 1 },
          { label: 'Bold', value: 2 },
          { label: 'Extra', value: 4 },
        ]}
      />

      <ButtonGroup
        label="Roughness"
        value={currentRoughness}
        onChange={(v: any) => handleChange('roughness', v)}
        options={[
          { label: 'Clean', value: 0 },
          { label: 'Sketch', value: 1 },
          { label: 'Cartoon', value: 2 },
        ]}
      />

      {showTextProperties && (
        <>
          <NumberInput
            label="Font Size"
            value={currentFontSize}
            onChange={(v: any) => handleChange('fontSize', v)}
          />
          <SelectInput
            label="Font Family"
            value={currentFontFamily}
            onChange={(v: any) => handleChange('fontFamily', v)}
            options={[
              { label: 'Hand (Caveat)', value: 'hand' },
              { label: 'Normal (Inter)', value: 'normal' },
              { label: 'Code (Monospace)', value: 'code' },
              { label: 'Serif (Georgia)', value: 'serif' },
              { label: 'Comic (Comic Sans)', value: 'comic' },
              { label: 'Impact', value: 'impact' },
            ]}
          />
          <SectionTitle>Formatting</SectionTitle>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => toggleList('bullet')}
              style={{ flex: 1, padding: '6px', borderRadius: 6, border: `1px solid ${border}`, background: isDark ? '#191920' : '#f1f3f5', color: text, cursor: 'pointer', fontSize: 12 }}>
              • Bullet
            </button>
            <button 
              onClick={() => toggleList('number')}
              style={{ flex: 1, padding: '6px', borderRadius: 6, border: `1px solid ${border}`, background: isDark ? '#191920' : '#f1f3f5', color: text, cursor: 'pointer', fontSize: 12 }}>
              1. Number
            </button>
          </div>
        </>
      )}
    </div>
  );
}
