import "../../styles/components/ui/input.css"

function Input({
  className = "",
  wrapperClassName = "",
  inputClassName = "",
  ...props
}) {
  const wrapperClassNames = ["ui-input", wrapperClassName].filter(Boolean).join(" ")
  const elementClassName = ["ui-input__field", className, inputClassName].filter(Boolean).join(" ")

  return (
    <div className={wrapperClassNames}>
      <input className={elementClassName} {...props} />
    </div>
  )
}

export default Input
