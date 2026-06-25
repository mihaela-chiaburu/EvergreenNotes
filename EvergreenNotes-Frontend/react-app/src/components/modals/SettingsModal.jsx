import { useEffect, useState } from "react"
import "../../styles/components/settings/settings.css"
import ModalShell from "./ModalShell"
import Input from "../ui/Input"
import Button from "../ui/Button"

import avatarImage from "../../assets/images/avatar.jpg"
import googleLogo from "../../assets/images/Logo-google.png"

function SettingsModal({
	isOpen,
	onClose,
	userName = "User",
	userEmail = "",
	userBio = "",
	userAvatar = "",
	onSaveProfile,
}) {
	const [activeTab, setActiveTab] = useState("general")
	const [name, setName] = useState(userName)
	const [bio, setBio] = useState(userBio)
	const [email, setEmail] = useState(userEmail)
	const [oldPassword, setOldPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [avatarPreview, setAvatarPreview] = useState(userAvatar || avatarImage)

	useEffect(() => {
		if (!isOpen) {
			return
		}

		setName(userName)
		setEmail(userEmail)
		setBio(userBio)
		setAvatarPreview(userAvatar || avatarImage)
		setOldPassword("")
		setNewPassword("")
	}, [isOpen, userName, userEmail, userBio, userAvatar])

	const handleAvatarChange = (event) => {
		const file = event.target.files?.[0]
		if (!file || !file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
			return
		}

		const reader = new FileReader()
		reader.onload = () => {
			if (typeof reader.result === "string") {
				setAvatarPreview(reader.result)
			}
		}
		reader.readAsDataURL(file)
	}

	const handleSaveProfile = () => {
		if (!onSaveProfile) {
			return
		}

		const trimmedName = name.trim()
		const trimmedBio = bio.trim()
		const normalizedAvatar = avatarPreview && avatarPreview !== avatarImage ? avatarPreview : ""
		onSaveProfile({
			username: trimmedName || userName,
			bio: trimmedBio,
			avatarUrl: normalizedAvatar,
		})
	}

	return (
		<ModalShell
			isOpen={isOpen}
			onClose={onClose}
			overlayClassName="settings-modal-overlay"
			className="settings-modal"
			labelledBy="settings-modal-title"
		>
			<button
				type="button"
				className="settings-modal__close"
				aria-label="Close settings"
				onClick={onClose}
			>
				x
			</button>

			<aside className="settings-modal__sidebar">
				<p id="settings-modal-title" className="settings-modal__sidebar-title">Settings</p>

				<div className="settings-modal__profile">
					<img
						src={avatarPreview}
						alt="User avatar"
						className="settings-modal__profile-image"
					/>
					<p className="settings-modal__profile-name">{userName}</p>
				</div>

				<div className="settings-modal__tabs" role="tablist" aria-label="Settings sections">
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === "general"}
						className={`settings-modal__tab ${
							activeTab === "general" ? "settings-modal__tab--active" : ""
						}`}
						onClick={() => setActiveTab("general")}
					>
						General
					</button>

					<button
						type="button"
						role="tab"
						aria-selected={activeTab === "account"}
						className={`settings-modal__tab ${
							activeTab === "account" ? "settings-modal__tab--active" : ""
						}`}
						onClick={() => setActiveTab("account")}
					>
						Account
					</button>
				</div>
			</aside>

			<section className="settings-modal__content">
				{activeTab === "general" && (
					<div className="settings-modal__panel" role="tabpanel">
						<div className="settings-modal__field">
							<p className="settings-modal__label">Name</p>
							<p className="settings-modal__hint">Change your name</p>
							<Input
								type="text"
								className="settings-modal__input"
								inputClassName="input--unstyled"
								value={name}
								onChange={(event) => setName(event.target.value)}
							/>
						</div>

						<div className="settings-modal__field">
							<p className="settings-modal__label">Bio</p>
							<p className="settings-modal__hint">Change your signature</p>
							<Input
								type="text"
								className="settings-modal__input"
								inputClassName="input--unstyled"
								value={bio}
								onChange={(event) => setBio(event.target.value)}
							/>
						</div>

						<div className="settings-modal__field settings-modal__field--avatar">
							<p className="settings-modal__label">Profile picture</p>
							<p className="settings-modal__hint">Upload an image or pick an avatar</p>
							<div className="settings-modal__avatar-row">
								<div className="settings-modal__avatar-placeholder" aria-hidden="true">
									<img
										src={avatarPreview}
										alt="Profile placeholder"
										className="settings-modal__avatar-placeholder-image"
									/>
								</div>
								<div className="settings-modal__avatar-actions">
									<input
										id="settings-avatar-upload"
										type="file"
										accept="image/*"
										className="settings-modal__avatar-input"
										onChange={handleAvatarChange}
									/>
									<label htmlFor="settings-avatar-upload" className="settings-modal__avatar-button">
										Upload image
									</label>
									<p className="settings-modal__avatar-note">JPG or PNG, under 2MB.</p>
								</div>
							</div>
						</div>

						<div className="settings-modal__actions">
							<Button type="button" variant="primary" onClick={handleSaveProfile}>
								Save changes
							</Button>
						</div>
					</div>
				)}

				{activeTab === "account" && (
					<div className="settings-modal__panel" role="tabpanel">
						<div className="settings-modal__field">
							<p className="settings-modal__label">Email</p>
							<p className="settings-modal__hint">Change your email address</p>
							<Input
								type="email"
								className="settings-modal__input"
								inputClassName="input--unstyled"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
							/>
						</div>

						<div className="settings-modal__field">
							<div className="settings-modal__password-labels">
								<p className="settings-modal__label">Password</p>
							</div>
							<div className="settings-modal__password-inputs">
								<div className="settings-modal__password-group">
									<p className="settings-modal__hint">Enter your old password</p>
									<Input
										type="password"
										className="settings-modal__input settings-modal__input--half"
										inputClassName="input--unstyled"
										value={oldPassword}
										onChange={(event) => setOldPassword(event.target.value)}
									/>
								</div>
								<div className="settings-modal__password-group">
									<p className="settings-modal__hint">Enter your new password</p>
									<Input
										type="password"
										className="settings-modal__input settings-modal__input--half"
										inputClassName="input--unstyled"
										value={newPassword}
										onChange={(event) => setNewPassword(event.target.value)}
									/>
								</div>
							</div>
						</div>

						<div className="settings-modal__field">
							<p className="settings-modal__label">Connected Accounts</p>
							<div className="settings-modal__connected-account">
								<img
									src={googleLogo}
									alt="Google logo"
									className="settings-modal__google-logo"
								/>
								<div className="settings-modal__connected-copy">
									<p className="settings-modal__connected-title">Google</p>
									<p className="settings-modal__connected-subtitle">
										Connected as {email || "user@gmail.com"}
									</p>
								</div>
								<Button type="button" variant="secondary" className="settings-modal__disconnect-button">
									Disconnect
								</Button>
							</div>
						</div>
					</div>
				)}
			</section>
		</ModalShell>
	)
}

export default SettingsModal
