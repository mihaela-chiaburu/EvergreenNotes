import Layout from "../components/Layout"
import "../styles/pages/help.css"

function HelpPage() {
	return (
		<Layout>
			<section className="help-page" aria-labelledby="help-page-title">
				<h1 id="help-page-title" className="help-page__title">Help</h1>
				<p className="help-page__subtitle">Quick answers for common actions in EvergreenNotes.</p>

				<div className="help-page__card">
					<h2 className="help-page__card-title">How to use this app</h2>
					<ul className="help-page__list">
						<li>Create a new note from My Garden using the New Seed input.</li>
						<li>Open a note from graph or list view to edit details and tags.</li>
						<li>Explore other gardens from the Explore page.</li>
						<li>Use Trash to restore or permanently remove deleted notes.</li>
					</ul>
				</div>
			</section>
		</Layout>
	)
}

export default HelpPage
