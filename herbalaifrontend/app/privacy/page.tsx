import type { Metadata } from 'next';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | Herbal-Ai',
  description: 'How Herbal-Ai uses account information, submitted content, Dr. Ai questions, and email.',
};

const sections = [
  {
    title: 'Account information',
    paragraphs: [
      'When you create an account, Herbal-Ai stores your name, username, email address, and a hashed password. If you sign in with Google, the system uses the account details returned by Google to create or access your Herbal-Ai account.',
      'Herbal-Ai uses sign-in cookies to keep you authenticated. The frontend also stores a local session marker to determine whether it should check for an existing sign-in.',
    ],
  },
  {
    title: 'Content you submit',
    paragraphs: [
      'The system stores herb suggestions, community posts and comments, and messages you send to other users. Community content is visible to people using the community pages. Messages are shown to the people in the conversation.',
      'Images attached to suggestions or messages are uploaded through Cloudinary, and their image URLs are stored with the related content.',
    ],
  },
  {
    title: 'Dr. Ai questions',
    paragraphs: [
      'When you ask Dr. Ai a question, the system uses your question and relevant herbal-library records to prepare a response with Google Gemini.',
    ],
  },
  {
    title: 'Emails from Herbal-Ai',
    paragraphs: [
      'The system uses your email address to send account verification links, password-reset links, and notices when a herb suggestion is approved or rejected. These messages are sent through the Herbal-Ai Gmail connection.',
      'That connection has the Gmail send permission only. It does not give the system access to read the sender’s Gmail inbox. Verification and reset links use tokens stored in the application database.',
    ],
  },
  {
    title: 'Questions about your data',
    paragraphs: [
      'For questions about information stored in your Herbal-Ai account, contact the Herbal-Ai team at kevinmercado987@gmail.com.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <div className="border-b border-line pb-8 sm:pb-10">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-brand">Herbal-Ai</p>
          <h1 className="font-editorial text-4xl font-semibold leading-tight sm:text-6xl">Privacy Policy</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
            This page explains how Herbal-Ai uses information provided through the website and its features.
          </p>
        </div>
        <div className="divide-y divide-line">
          {sections.map((section) => (
            <section key={section.title} className="grid gap-4 py-8 sm:grid-cols-[13rem_1fr] sm:gap-8 sm:py-10">
              <h2 className="font-editorial text-2xl font-semibold leading-snug">{section.title}</h2>
              <div className="space-y-4 text-sm leading-7 text-muted sm:text-base">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
