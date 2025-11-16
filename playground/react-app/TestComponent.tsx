import React from 'react'

const TestComponent: React.FC = () => {
  return (
    <div style={{ backgroundColor: 'blue', padding: '20px', marginTop: '10px' }}>
      <h1 style={{ fontSize: '24px', color: 'white', textAlign: 'center' }}>
        React Test Component
      </h1>
      <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '15px' }}>
        This is a test component with inline styles for React.
        Select the component and run "Extract Inline Styles to CSS Module" command.
      </p>
      <button style={{ backgroundColor: 'white', color: 'blue', padding: '10px 20px', borderRadius: '4px', border: 'none' }}>
        Click Me
      </button>
    </div>
  )
}

export default TestComponent