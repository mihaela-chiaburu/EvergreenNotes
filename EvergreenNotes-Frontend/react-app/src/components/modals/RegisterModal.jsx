import { useEffect, useState } from "react"
import "../../styles/components/modals/auth-modal.css"

import eyeIcon from "../../assets/images/view.png"
import googleLogo from "../../assets/images/Logo-google.png"

function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
	const [email, setEmail] = useState("")
	const [username, setUsername] = useState("")
	const [password, setPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)

	useEffect(() => {
		if (!isOpen) {
			return undefined
		}

		const originalOverflow = document.body.style.overflow
		document.body.style.overflow = "hidden"

		function handleEscape(event) {
			if (event.key === "Escape") {
				onClose()
			}
		}

		document.addEventListener("keydown", handleEscape)

		return () => {
			document.body.style.overflow = originalOverflow
			document.removeEventListener("keydown", handleEscape)
		}
	}, [isOpen, onClose])

	if (!isOpen) {
		return null
	}

	return (
		<div className="auth-modal-overlay" onClick={onClose}>
			<div
				className="auth-modal auth-modal--register"
				role="dialog"
				aria-modal="true"
				aria-labelledby="register-modal-title"
				onClick={(event) => event.stopPropagation()}
			>
				<button
					type="button"
					className="auth-modal__close"
					aria-label="Close register modal"
					onClick={onClose}
				>
					x
				</button>

				<p id="register-modal-title" className="auth-modal__title">Sign Up</p>

				<div className="auth-modal__field">
					<p className="auth-modal__hint">Email</p>
					<input
						type="email"
						className="auth-modal__input"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>
				</div>

				<div className="auth-modal__field">
					<p className="auth-modal__hint">Username</p>
					<input
						type="text"
						className="auth-modal__input"
						value={username}
						onChange={(event) => setUsername(event.target.value)}
					/>
				</div>

				<div className="auth-modal__field">
					<p className="auth-modal__hint">Password</p>
					<div className="auth-modal__password-wrapper">
						<input
							type={showPassword ? "text" : "password"}
							className="auth-modal__input auth-modal__input--password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
						/>
						<button
							type="button"
							className="auth-modal__password-toggle"
							onClick={() => setShowPassword((prev) => !prev)}
							aria-label={showPassword ? "Hide password" : "Show password"}
						>
							<img src={eyeIcon} alt="toggle password visibility" />
						</button>
					</div>
				</div>

				<button type="button" className="auth-modal__submit">Sign Up</button>

				<p className="auth-modal__switch-copy">
					Already have an account? {" "}
					<button
						type="button"
						className="auth-modal__switch-link"
						onClick={onSwitchToLogin}
					>
						Sign in
					</button>
					.
				</p>

				<p className="auth-modal__social-copy">or log in with</p>

				<button type="button" className="auth-modal__social-button" aria-label="Continue with Google">
					<img src={googleLogo} alt="Google" className="auth-modal__social-icon" />
				</button>
			</div>
		</div>
	)
}

export default RegisterModal
