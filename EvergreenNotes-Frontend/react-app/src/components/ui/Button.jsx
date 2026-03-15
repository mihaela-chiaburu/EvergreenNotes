import "../../styles/components/ui/button.css"

function Button({
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const buttonClassName = [
    "ui-button",
    `ui-button--${variant}`,
    `ui-button--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return <button type={type} className={buttonClassName} {...props} />
}

export default Button
