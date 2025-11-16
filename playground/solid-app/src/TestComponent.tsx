import styles from './TestComponent.module.css'

function Comp(props: {style: Record<string, any>}){
  return <></>
}

export default () => {
  return (
    <div style={{ 'background-color': 'white', color: 'blue', padding: '10px 20px', 'border-radius': '4px', border: 'none' }}>
      <Comp style={{ 'background-color': 'white', color: 'blue', padding: '10px 20px', 'border-radius': '4px', border: 'none' }}/>
      <h1 style={{ 'background-color': 'white', color: 'blue', padding: '10px 20px', 'border-radius': '4px', border: 'none' }}>
        React Test Component
      </h1>
      <p style={{ 'background-color': 'white', color: 'blue', padding: '10px 20px', 'border-radius': '4px', border: 'none' }}>
        This is a test component with inline styles for React.
        Select the component and run "Extract Inline Styles to CSS Module" command.
      </p>
      <button style={{ 'background-color': 'white', color: 'blue', padding: '10px 20px', 'border-radius': '4px', border: 'none' }}>
        Click Me
      </button>
    </div>
  )
}

