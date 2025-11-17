import { Component, createSignal, Show } from 'solid-js'

/**
 * Solid Test Component for VSCode Style-to-CSS Extension
 * 
 * This component demonstrates all the features of the extension with Solid.js:
 * - Static style extraction (converted to CSS classes)
 * - Dynamic style preservation (kept as inline styles with reactivity)
 * - Spread property handling
 * - Solid-specific conventions (class attribute, kebab-case properties)
 * 
 * USAGE:
 * 1. Place cursor on any element with a style prop
 * 2. Run the "Refactor: Extract Inline Styles to CSS Module" command
 * 3. The extension will:
 *    - Extract static styles to a .module.css file
 *    - Replace style prop with class={styles.generatedName}
 *    - Keep dynamic styles (signals, functions) in the style prop
 *    - Add CSS module import if needed
 * 
 * SOLID.JS CONFIGURATION:
 * - Uses 'class' attribute (not 'className')
 * - Uses kebab-case CSS properties ('font-size' not 'fontSize')
 * - Supports Solid signals and reactive expressions
 */

const TestComponent: Component = () => {
  const [isActive, setIsActive] = createSignal(false)
  const [size, setSize] = createSignal(20)
  const primaryColor = '#e74c3c'
  
  const dynamicPadding = () => `${size()}px`
  
  const dynamicStyles = {
    transform: 'scale(1.05)',
    transition: 'all 0.3s ease'
  }

  return (
    <div style={{ 'font-family': 'Arial, sans-serif', 'max-width': '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ 'font-size': '32px', color: '#2c3e50', 'text-align': 'center', 'margin-bottom': '30px' }}>
        ⚡ Solid Style-to-CSS Extension Demo
      </h1>
      
      {/* FEATURE 1: Pure Static Styles - Complete Extraction */}
      <section style={{ 'margin-bottom': '40px' }}>
        <h2 style={{ 'font-size': '20px', color: '#34495e', 'margin-bottom': '10px' }}>
          ✅ Feature 1: Pure Static Styles
        </h2>
        <p style={{ color: '#7f8c8d', 'margin-bottom': '15px' }}>
          All properties are static values → Extension extracts everything to CSS class
        </p>
        <div style={{ 
          'background-color': '#e74c3c', 
          padding: '20px', 
          'margin-top': '10px',
          'border-radius': '8px',
          color: 'white',
          'font-weight': 'bold'
        }}>
          🎯 Try extracting this! All styles are static and will become a CSS class.
        </div>
      </section>

      {/* FEATURE 2: Pure Dynamic Styles - No Extraction */}
      <section style={{ 'margin-bottom': '40px' }}>
        <h2 style={{ 'font-size': '20px', color: '#34495e', 'margin-bottom': '10px' }}>
          🚫 Feature 2: Pure Dynamic Styles (Solid Signals)
        </h2>
        <p style={{ color: '#7f8c8d', 'margin-bottom': '15px' }}>
          All properties use signals/reactive expressions → Extension keeps style prop unchanged
        </p>
        <div style={{ 
          'background-color': primaryColor, 
          padding: dynamicPadding(),
          'border-radius': `${size() / 4}px`,
          color: isActive() ? 'yellow' : 'white',
          'box-shadow': isActive() ? '0 4px 8px rgba(0,0,0,0.3)' : 'none'
        }}>
          🎯 Try extracting this! Nothing extracted because all styles use Solid signals.
        </div>
      </section>

      {/* FEATURE 3: Mixed Static + Dynamic - Smart Separation */}
      <section style={{ 'margin-bottom': '40px' }}>
        <h2 style={{ 'font-size': '20px', color: '#34495e', 'margin-bottom': '10px' }}>
          🔄 Feature 3: Mixed Static + Dynamic (Solid Reactivity)
        </h2>
        <p style={{ color: '#7f8c8d', 'margin-bottom': '15px' }}>
          Some properties static, some use signals → Extension extracts static to CSS, keeps reactive inline
        </p>
        <div style={{ 
          'background-color': '#9b59b6',          // ✅ STATIC - will be extracted
          color: 'white',                         // ✅ STATIC - will be extracted  
          'font-size': '16px',                    // ✅ STATIC - will be extracted (kebab-case)
          'font-weight': 'bold',                  // ✅ STATIC - will be extracted (kebab-case)
          'border-radius': '6px',                 // ✅ STATIC - will be extracted (kebab-case)
          padding: dynamicPadding(),              // ❌ DYNAMIC - Solid signal stays inline
          border: isActive() ? '3px solid gold' : '1px solid purple',  // ❌ DYNAMIC - signal stays inline
          transform: isActive() ? 'scale(1.05)' : 'scale(1)',         // ❌ DYNAMIC - signal stays inline
          opacity: isActive() ? 1 : 0.8           // ❌ DYNAMIC - signal stays inline
        }}>
          🎯 Try extracting this! Static styles → CSS class, signals → inline
        </div>
      </section>

      {/* FEATURE 4: Spread Properties - Preserved as Dynamic */}
      <section style={{ 'margin-bottom': '40px' }}>
        <h2 style={{ 'font-size': '20px', color: '#34495e', 'margin-bottom': '10px' }}>
          📦 Feature 4: Spread Properties
        </h2>
        <p style={{ color: '#7f8c8d', 'margin-bottom': '15px' }}>
          Object spreads are always dynamic → Extension preserves them in style prop
        </p>
        <div style={{ 
          'background-color': '#27ae60',         // ✅ STATIC - will be extracted
          color: 'white',                        // ✅ STATIC - will be extracted
          padding: '15px',                       // ✅ STATIC - will be extracted
          'border-radius': '8px',                // ✅ STATIC - will be extracted (kebab-case)
          ...dynamicStyles,                      // ❌ SPREAD - always stays inline
          border: '2px solid darkgreen'          // ✅ STATIC - will be extracted (after spread)
        }}>
          🎯 Try extracting this! Spread (...dynamicStyles) stays inline, rest becomes CSS class
        </div>
      </section>

      {/* FEATURE 5: Solid-Specific Conventions */}
      <section style={{ 'margin-bottom': '40px' }}>
        <h2 style={{ 'font-size': '20px', color: '#34495e', 'margin-bottom': '10px' }}>
          ⚡ Feature 5: Solid Conventions
        </h2>
        <p style={{ color: '#7f8c8d', 'margin-bottom': '15px' }}>
          kebab-case properties → class attribute (configured for Solid)
        </p>
        <button style={{
          'background-color': '#f39c12',        // ✅ STATIC - will be extracted
          color: 'white',                       // ✅ STATIC - will be extracted
          padding: '12px 24px',                 // ✅ STATIC - will be extracted
          'border-radius': '6px',               // ✅ STATIC - will be extracted (kebab-case preserved)
          border: 'none',                       // ✅ STATIC - will be extracted
          cursor: 'pointer',                    // ✅ STATIC - will be extracted
          'font-size': '14px',                  // ✅ STATIC - will be extracted (kebab-case preserved)
          'font-weight': 'bold',                // ✅ STATIC - will be extracted (kebab-case preserved)
          opacity: isActive() ? 1 : 0.7,        // ❌ DYNAMIC - Solid signal stays inline
          transform: `translateY(${isActive() ? -2 : 0}px)` // ❌ DYNAMIC - signal template stays inline
        }}
        onClick={() => setIsActive(!isActive())}
        >
          🎯 Solid Button (kebab-case CSS properties)
        </button>
      </section>

      {/* FEATURE 6: Template Literals with Solid Signals */}
      <section style={{ 'margin-bottom': '40px' }}>
        <h2 style={{ 'font-size': '20px', color: '#34495e', 'margin-bottom': '10px' }}>
          📝 Feature 6: Template Literals & Signals
        </h2>
        <p style={{ color: '#7f8c8d', 'margin-bottom': '15px' }}>
          Simple template literals → static, templates with signals → dynamic
        </p>
        <div>
          <p style={{
            'font-size': '16px',                 // ✅ STATIC - will be extracted (kebab-case)
            'line-height': '1.6',                // ✅ STATIC - will be extracted (kebab-case)
            margin: '10px 0',                    // ✅ STATIC - will be extracted
            padding: '10px',                     // ✅ STATIC - will be extracted
            'background-color': '#ecf0f1',       // ✅ STATIC - will be extracted (kebab-case)
            'border-left': '4px solid #e74c3c',  // ✅ STATIC - will be extracted (kebab-case)
            color: `hsl(${size() * 6}, 60%, 40%)` // ❌ DYNAMIC - template with signal
          }}>
            🎯 Template literal with Solid signal: color reacts to size slider
          </p>
        </div>
      </section>

      {/* FEATURE 7: Solid Signal Expressions */}
      <section style={{ 'margin-bottom': '40px' }}>
        <h2 style={{ 'font-size': '20px', color: '#34495e', 'margin-bottom': '10px' }}>
          ⚡ Feature 7: Solid Signal Expressions
        </h2>
        <p style={{ color: '#7f8c8d', 'margin-bottom': '15px' }}>
          Complex signal-based expressions are preserved for reactivity
        </p>
        <div style={{
          'background-color': '#34495e',        // ✅ STATIC - will be extracted (kebab-case)
          color: 'white',                       // ✅ STATIC - will be extracted
          'font-weight': 'bold',                // ✅ STATIC - will be extracted (kebab-case)
          'text-transform': 'uppercase',        // ✅ STATIC - will be extracted (kebab-case)
          'letter-spacing': '1px',              // ✅ STATIC - will be extracted (kebab-case)
          padding: '15px',                      // ✅ STATIC - will be extracted
          width: `${size() * 8}px`,             // ❌ DYNAMIC - signal expression
          height: `${Math.max(40, size() * 2)}px`, // ❌ DYNAMIC - complex signal expression
          'animation-duration': `${size() / 10}s`  // ❌ DYNAMIC - signal in template (kebab-case)
        }}>
          🎯 Complex signal expressions: width and height react to slider
        </div>
      </section>

      {/* FEATURE 8: Self-Closing Elements */}
      <section style={{ 'margin-bottom': '40px' }}>
        <h2 style={{ 'font-size': '20px', color: '#34495e', 'margin-bottom': '10px' }}>
          📱 Feature 8: Self-Closing Elements
        </h2>
        <p style={{ color: '#7f8c8d', 'margin-bottom': '15px' }}>
          Works on all JSX elements including self-closing ones
        </p>
        <input 
          style={{ 
            border: '2px solid #bdc3c7',        // ✅ STATIC - will be extracted
            padding: '12px',                     // ✅ STATIC - will be extracted
            'border-radius': '6px',              // ✅ STATIC - will be extracted (kebab-case)
            'font-size': '14px',                 // ✅ STATIC - will be extracted (kebab-case)
            'background-color': '#ffffff',       // ✅ STATIC - will be extracted (kebab-case)
            width: `${size() * 8}px`,            // ❌ DYNAMIC - signal expression
            outline: 'none'                      // ✅ STATIC - will be extracted
          }} 
          placeholder="🎯 Solid input with mixed styles!"
        />
      </section>

      {/* FEATURE 9: Custom Components */}
      <section style={{ 'margin-bottom': '40px' }}>
        <h2 style={{ 'font-size': '20px', color: '#34495e', 'margin-bottom': '10px' }}>
          🧩 Feature 9: Custom Solid Components
        </h2>
        <p style={{ color: '#7f8c8d', 'margin-bottom': '15px' }}>
          Works with custom Solid components that accept style props
        </p>
        <CustomComponent style={{
          'background-color': '#8e44ad',        // ✅ STATIC - will be extracted (kebab-case)
          color: 'white',                       // ✅ STATIC - will be extracted
          padding: '16px',                      // ✅ STATIC - will be extracted
          'border-radius': '8px',               // ✅ STATIC - will be extracted (kebab-case)
          'font-weight': 'bold',                // ✅ STATIC - will be extracted (kebab-case)
          'text-align': 'center',               // ✅ STATIC - will be extracted (kebab-case)
          opacity: isActive() ? 1 : 0.6,        // ❌ DYNAMIC - Solid signal stays inline
          transform: isActive() ? 'scale(1.02)' : 'scale(1)' // ❌ DYNAMIC - signal stays inline
        }} />
      </section>

      {/* FEATURE 10: Conditional Rendering with Solid Show */}
      <section style={{ 'margin-bottom': '40px' }}>
        <h2 style={{ 'font-size': '20px', color: '#34495e', 'margin-bottom': '10px' }}>
          👁️ Feature 10: Conditional Rendering (Solid Show)
        </h2>
        <p style={{ color: '#7f8c8d', 'margin-bottom': '15px' }}>
          Solid's Show component with reactive styling
        </p>
        <Show when={isActive()}>
          <div style={{
            'background-color': '#f1c40f',      // ✅ STATIC - will be extracted (kebab-case)
            color: 'black',                     // ✅ STATIC - will be extracted
            padding: '15px',                    // ✅ STATIC - will be extracted
            'border-radius': '8px',             // ✅ STATIC - will be extracted (kebab-case)
            'font-weight': 'bold',              // ✅ STATIC - will be extracted (kebab-case)
            'text-align': 'center',             // ✅ STATIC - will be extracted (kebab-case)
            'animation-duration': `${size() / 10}s`, // ❌ DYNAMIC - signal template (kebab-case)
            'box-shadow': `0 ${size() / 8}px ${size() / 4}px rgba(0,0,0,0.2)` // ❌ DYNAMIC - complex signal
          }}>
            🎯 Conditionally rendered with Solid Show - mix of static and reactive styles
          </div>
        </Show>
        <Show when={!isActive()}>
          <p style={{ color: '#95a5a6', 'font-style': 'italic', 'text-align': 'center' }}>
            Toggle "Active" to see conditional content with reactive styles
          </p>
        </Show>
      </section>

      {/* FEATURE 11: Edge Cases */}
      <section style={{ 'margin-bottom': '40px' }}>
        <h2 style={{ 'font-size': '20px', color: '#34495e', 'margin-bottom': '10px' }}>
          🔍 Feature 11: Edge Cases
        </h2>
        <p style={{ color: '#7f8c8d', 'margin-bottom': '15px' }}>
          Computed property names and complex expressions
        </p>
        <div style={{
          'background-color': '#16a085',
          color: 'white',
          padding: '15px',
          'border-radius': '8px',
          ['font-weight']: 'bold',             // ❌ DYNAMIC - computed property name
          width: '300px',                      // ✅ STATIC - will be extracted
          'text-align': 'center'               // ✅ STATIC - will be extracted (kebab-case)
        }}>
          🎯 Computed property name ['font-weight'] stays dynamic
        </div>
      </section>

      {/* Interactive Controls */}
      <section style={{ 
        'margin-top': '40px', 
        padding: '20px', 
        'background-color': '#ecf0f1',
        'border-radius': '8px',
        border: '1px solid #bdc3c7'
      }}>
        <h3 style={{ 'font-size': '18px', color: '#2c3e50', 'margin-bottom': '15px' }}>
          🎮 Solid Interactive Controls
        </h3>
        <div style={{ display: 'flex', gap: '20px', 'align-items': 'center', 'flex-wrap': 'wrap' }}>
          <button 
            onClick={() => setIsActive(!isActive())}
            style={{
              'background-color': isActive() ? '#27ae60' : '#95a5a6',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              'border-radius': '4px',
              cursor: 'pointer',
              'font-weight': 'bold'
            }}
          >
            Toggle Active: {isActive() ? 'ON' : 'OFF'}
          </button>
          <label style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
            <span style={{ 'font-size': '14px', 'font-weight': 'bold' }}>Size: {size()}px</span>
            <input 
              type="range" 
              min="10" 
              max="50" 
              value={size()} 
              onInput={(e) => setSize(Number((e.target as HTMLInputElement).value))}
              style={{ 
                cursor: 'pointer',
                'accent-color': '#e74c3c'
              }}
            />
          </label>
        </div>
        <p style={{ 
          'font-size': '12px', 
          color: '#7f8c8d', 
          'margin-top': '10px',
          'font-style': 'italic'
        }}>
          Use these controls to see Solid signal reactivity in dynamic styles
        </p>
      </section>
    </div>
  )
}

// Custom component for testing
const CustomComponent: Component<{ style?: any }> = (props) => (
  <div style={props.style}>
    ⚡ Custom Solid Component with passed-through styles
  </div>
)

export default TestComponent