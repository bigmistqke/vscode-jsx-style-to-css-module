import styles from './TestComponent.module.css'

export default () => {
  return (
    <div className={styles['container']}>
      <h1 className={styles['style-mimtmrkp']}>
        React Test Component
      </h1>
      <p class={styles['style-udtluyud']}>
        This is a test component with inline styles for React.
        Select the component and run "Extract Inline Styles to CSS Module" command.
      </p>
      <button style={{ 'background-color': 'white', color: 'blue', padding: '10px 20px', borderRadius: '4px', border: 'none' }}>
        Click Me
      </button>
    </div>
  )
}

