import { Component } from 'solid-js'

const TestComponent: Component = () => {
  return (
    <div style={{ 'background-color': 'green', padding: '20px', 'margin-top': '10px' }}>
      <h1 style={{ 'font-size': '24px', color: 'white', 'text-align': 'center' }}>
        Solid Test Component
      </h1>
      <p style={{ 'font-size': '16px', 'line-height': '1.5', 'margin-bottom': '15px' }}>
        This is a test component with inline styles for Solid.
        Select the component and run "Extract Inline Styles to CSS Module" command.
      </p>
      <button style={{ 'background-color': 'white', color: 'green', padding: '10px 20px', 'border-radius': '4px', border: 'none' }}>
        Click Me
      </button>
    </div>
  )
}

export default TestComponent