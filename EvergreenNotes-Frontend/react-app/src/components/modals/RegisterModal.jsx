import { useState } from "react"
import "../../styles/components/modals/auth-modal.css"
import ModalShell from "./ModalShell"
import Button from "../ui/Button"
import Input from "../ui/Input"
import { registerUser } from "../../utils/auth"

import eyeIcon from "../../assets/images/view.png"
import googleLogo from "../../assets/images/Logo-google.png"

function RegisterModal({ isOpen, onClose, onSwitchToLogin, onAuthSuccess }) {
	const [email, setEmail] = useState("")
	const [username, setUsername] = useState("")
	const [password, setPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async () => {
		const normalizedEmail = email.trim()
		const normalizedUsername = username.trim()

		if (!normalizedEmail || !normalizedUsername || !password) {
			setError("Email, username and password are required.")
			return
		}

		setIsSubmitting(true)
		setError("")

		try {
			const auth = await registerUser({
				email: normalizedEmail,
				username: normalizedUsername,
				password,
			})

			if (onAuthSuccess) {
				await onAuthSuccess(auth)
			}
			onClose()
		} catch (submitError) {
			setError(submitError.message)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<ModalShell
			isOpen={isOpen}
			onClose={onClose}
			overlayClassName="auth-modal-overlay"
			className="auth-modal auth-modal--register"
			labelledBy="register-modal-title"
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
					<Input
						type="email"
						className="auth-modal__input"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>
				</div>

				<div className="auth-modal__field">
					<p className="auth-modal__hint">Username</p>
					<Input
						type="text"
						className="auth-modal__input"
						value={username}
						onChange={(event) => setUsername(event.target.value)}
					/>
				</div>

				<div className="auth-modal__field">
					<p className="auth-modal__hint">Password</p>
					<div className="auth-modal__password-wrapper">
						<Input
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

				{error ? <p className="auth-modal__error">{error}</p> : null}

				<Button
					type="button"
					className="auth-modal__submit"
					onClick={handleSubmit}
					disabled={isSubmitting}
				>
					{isSubmitting ? "Creating account..." : "Sign Up"}
				</Button>

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
		</ModalShell>
	)
}

export default RegisterModal
