import unittest

from scraper import plain_text_to_html, strip_html


class FormattingTests(unittest.TestCase):
    def test_numbered_headings_and_labels_become_structured_html(self):
        text = (
            "TERMS OF REFERENCE 1. Position Details Job Title: Project Officer "
            "Project Location: Borama 7. Required Qualifications and Experience "
            "Education Bachelor degree in Social Sciences Experience Minimum of 3 years"
        )

        html = plain_text_to_html(text)

        self.assertIn("<h3>Position Details</h3>", html)
        self.assertIn("<strong>Job Title:</strong> Project Officer", html)
        self.assertIn("<strong>Project Location:</strong> Borama", html)
        self.assertIn("<h3>Required Qualifications and Experience</h3>", html)

    def test_bullets_are_preserved(self):
        html = plain_text_to_html(
            "Responsibilities\n\n"
            "- Coordinate field activities\n"
            "- Prepare reports\n"
            "- Work with community teams"
        )

        self.assertIn("<h3>Responsibilities</h3>", html)
        self.assertIn("<ul>", html)
        self.assertIn("<li>Coordinate field activities</li>", html)
        self.assertIn("<li>Prepare reports</li>", html)

    def test_email_and_url_are_clickable(self):
        html = plain_text_to_html(
            "How to Apply\n\nSend applications to hr@example.org or visit www.example.org/jobs."
        )

        self.assertIn('href="mailto:hr@example.org"', html)
        self.assertIn('href="https://www.example.org/jobs"', html)
        self.assertNotIn("===", strip_html(html))


if __name__ == "__main__":
    unittest.main()
