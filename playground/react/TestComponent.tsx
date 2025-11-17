import React, { useState } from 'react'

/**
 * React Test Component for VSCode Style-to-CSS Extension
 * 
 * This component demonstrates all the features of the extension:
 * - Static style extraction (converted to CSS classes)
 * - Dynamic style preservation (kept as inline styles)
 * - Spread property handling
 * - React-specific conventions (className, camelCase properties)
 * 
 * USAGE:
 * 1. Place cursor on any element with a style prop
 * 2. Run the "Refactor: Extract Inline Styles to CSS Module" command
 * 3. The extension will:
 *    - Extract static styles to a .module.css file
 *    - Replace style prop with className={styles.generatedName}
 *    - Keep dynamic styles in the style prop
 *    - Add CSS module import if needed
 */

const TestComponent: React.FC = () => {
  const [isActive, setIsActive] = useState(false)
  const [size, setSize] = useState(20)
  const primaryColor = '#3498db'
  const dynamicPadding = `${size}px`
  
  const dynamicStyles = {
    transform: 'scale(1.1)',
    transition: 'all 0.3s ease'
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '32px', color: '#2c3e50', textAlign: 'center', marginBottom: '30px' }}>
        🎨 React Style-to-CSS Extension Demo
      </h1>
      
      {/* FEATURE 1: Pure Static Styles - Complete Extraction */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', color: '#34495e', marginBottom: '10px' }}>
          ✅ Feature 1: Pure Static Styles
        </h2>
        <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
          All properties are static values → Extension extracts everything to CSS class
        </p>
        <div style={{ 
          backgroundColor: '#3498db', 
          padding: '20px', 
          marginTop: '10px',
          borderRadius: '8px',
          color: 'white',
          fontWeight: 'bold'
        }}>
          🎯 Try extracting this! All styles are static and will become a CSS class.
        </div>
      </section>

      {/* FEATURE 2: Pure Dynamic Styles - No Extraction */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', color: '#34495e', marginBottom: '10px' }}>
          🚫 Feature 2: Pure Dynamic Styles
        </h2>
        <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
          All properties use variables/expressions → Extension keeps style prop unchanged
        </p>
        <div style={{ 
          backgroundColor: primaryColor, 
          padding: dynamicPadding,
          borderRadius: `${size / 4}px`,
          color: isActive ? 'yellow' : 'white'
        }}>
          🎯 Try extracting this! Nothing will be extracted because all styles are dynamic.
        </div>
      </section>

      {/* FEATURE 3: Mixed Static + Dynamic - Smart Separation */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', color: '#34495e', marginBottom: '10px' }}>
          🔄 Feature 3: Mixed Static + Dynamic Styles
        </h2>
        <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
          Some properties static, some dynamic → Extension extracts static to CSS, keeps dynamic inline
        </p>
        <div style={{ 
          backgroundColor: '#e74c3c',          // ✅ STATIC - will be extracted
          color: 'white',                      // ✅ STATIC - will be extracted  
          fontSize: '16px',                    // ✅ STATIC - will be extracted
          fontWeight: 'bold',                  // ✅ STATIC - will be extracted
          borderRadius: '6px',                 // ✅ STATIC - will be extracted
          padding: dynamicPadding,             // ❌ DYNAMIC - stays inline
          border: isActive ? '3px solid gold' : '1px solid darkred',  // ❌ DYNAMIC - stays inline
          transform: isActive ? 'scale(1.05)' : 'scale(1)',          // ❌ DYNAMIC - stays inline
          opacity: isActive ? 1 : 0.8          // ❌ DYNAMIC - stays inline
        }}>
          🎯 Try extracting this! Static styles → CSS class, dynamic styles → inline
        </div>
      </section>

      {/* FEATURE 4: Spread Properties - Preserved as Dynamic */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', color: '#34495e', marginBottom: '10px' }}>
          📦 Feature 4: Spread Properties
        </h2>
        <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
          Object spreads are always dynamic → Extension preserves them in style prop
        </p>
        <div style={{ 
          backgroundColor: '#27ae60',         // ✅ STATIC - will be extracted
          color: 'white',                     // ✅ STATIC - will be extracted
          padding: '15px',                    // ✅ STATIC - will be extracted
          borderRadius: '8px',                // ✅ STATIC - will be extracted
          ...dynamicStyles,                   // ❌ SPREAD - always stays inline
          border: '2px solid darkgreen'       // ✅ STATIC - will be extracted (after spread)
        }}>
          🎯 Try extracting this! Spread (...dynamicStyles) stays inline, rest becomes CSS class
        </div>
      </section>

      {/* FEATURE 5: React-Specific Conventions */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', color: '#34495e', marginBottom: '10px' }}>
          ⚛️ Feature 5: React Conventions
        </h2>
        <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
          camelCase properties → className attribute (configured for React)
        </p>
        <button style={{
          backgroundColor: '#8e44ad',        // ✅ STATIC - will be extracted
          color: 'white',                    // ✅ STATIC - will be extracted
          padding: '12px 24px',              // ✅ STATIC - will be extracted
          borderRadius: '6px',               // ✅ STATIC - will be extracted (camelCase → border-radius)
          border: 'none',                    // ✅ STATIC - will be extracted
          cursor: 'pointer',                 // ✅ STATIC - will be extracted
          fontSize: '14px',                  // ✅ STATIC - will be extracted (camelCase → font-size)
          fontWeight: 'bold',                // ✅ STATIC - will be extracted
          opacity: isActive ? 1 : 0.7,       // ❌ DYNAMIC - stays inline
          transform: `translateY(${isActive ? -2 : 0}px)` // ❌ DYNAMIC - stays inline
        }}
        onClick={() => setIsActive(!isActive)}
        >
          🎯 React Button (camelCase → kebab-case CSS)
        </button>
      </section>

      {/* FEATURE 6: Template Literals - Dynamic Detection */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', color: '#34495e', marginBottom: '10px' }}>
          📝 Feature 6: Template Literals
        </h2>
        <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
          Simple template literals → static, complex with variables → dynamic
        </p>
        <div>
          <p style={{
            fontSize: '16px',                 // ✅ STATIC - will be extracted
            lineHeight: '1.6',                // ✅ STATIC - will be extracted  
            margin: '10px 0',                 // ✅ STATIC - will be extracted
            padding: '10px',                  // ✅ STATIC - will be extracted
            backgroundColor: '#ecf0f1',       // ✅ STATIC - will be extracted
            borderLeft: '4px solid #3498db',  // ✅ STATIC - will be extracted
            color: `hsl(${size * 6}, 60%, 40%)` // ❌ DYNAMIC - template literal with variable
          }}>
            🎯 Template literal with variable: color changes with size slider
          </p>
        </div>
      </section>

      {/* FEATURE 7: Self-Closing Elements */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', color: '#34495e', marginBottom: '10px' }}>
          📱 Feature 7: Self-Closing Elements
        </h2>
        <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
          Works on all JSX elements including self-closing ones
        </p>
        <input 
          style={{ 
            border: '2px solid #bdc3c7',     // ✅ STATIC - will be extracted
            padding: '12px',                 // ✅ STATIC - will be extracted
            borderRadius: '6px',             // ✅ STATIC - will be extracted
            fontSize: '14px',                // ✅ STATIC - will be extracted
            backgroundColor: '#ffffff',      // ✅ STATIC - will be extracted
            width: `${size * 8}px`,          // ❌ DYNAMIC - width changes with slider
            outline: 'none'                  // ✅ STATIC - will be extracted
          }} 
          placeholder="🎯 Try extracting styles from this input!"
        />
      </section>

      {/* FEATURE 8: Custom Components */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', color: '#34495e', marginBottom: '10px' }}>
          🧩 Feature 8: Custom Components
        </h2>
        <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
          Works with custom components that accept style props
        </p>
        <CustomComponent style={{
          backgroundColor: '#f39c12',        // ✅ STATIC - will be extracted
          color: 'white',                    // ✅ STATIC - will be extracted
          padding: '16px',                   // ✅ STATIC - will be extracted
          borderRadius: '8px',               // ✅ STATIC - will be extracted
          fontWeight: 'bold',                // ✅ STATIC - will be extracted
          textAlign: 'center',               // ✅ STATIC - will be extracted
          opacity: isActive ? 1 : 0.6,       // ❌ DYNAMIC - stays inline
          transform: isActive ? 'scale(1.02)' : 'scale(1)' // ❌ DYNAMIC - stays inline
        }} />
      </section>

      {/* FEATURE 9: Edge Cases */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', color: '#34495e', marginBottom: '10px' }}>
          🔍 Feature 9: Edge Cases
        </h2>
        <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
          Computed property names and complex expressions
        </p>
        <div style={{
          backgroundColor: '#9b59b6',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          ['fontWeight']: 'bold',            // ❌ DYNAMIC - computed property name
          width: '300px',                    // ✅ STATIC - will be extracted
          textAlign: 'center'                // ✅ STATIC - will be extracted
        }}>
          🎯 Computed property name ['fontWeight'] stays dynamic
        </div>
      </section>

      {/* Interactive Controls */}
      <section style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#ecf0f1',
        borderRadius: '8px',
        border: '1px solid #bdc3c7'
      }}>
        <h3 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '15px' }}>
          🎮 Interactive Controls
        </h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setIsActive(!isActive)}
            style={{
              backgroundColor: isActive ? '#27ae60' : '#95a5a6',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Toggle Active: {isActive ? 'ON' : 'OFF'}
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Size: {size}px</span>
            <input 
              type="range" 
              min="10" 
              max="50" 
              value={size} 
              onChange={(e) => setSize(Number(e.target.value))}
              style={{ 
                cursor: 'pointer',
                accentColor: '#3498db'
              }}
            />
          </label>
        </div>
        <p style={{ 
          fontSize: '12px', 
          color: '#7f8c8d', 
          marginTop: '10px',
          fontStyle: 'italic'
        }}>
          Use these controls to see dynamic styles change in real-time
        </p>
      </section>
    </div>
  )
}

// Custom component for testing
const CustomComponent: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={style}>
    🧩 Custom Component with passed-through styles
  </div>
)

export default TestComponent