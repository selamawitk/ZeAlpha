import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-ivory py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-[2rem] p-8 shadow-premium">
        <div className="mb-8">
          <Link to="/" className="text-primary hover:text-primary-dark mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-serif font-bold text-primary-dark mb-4">Privacy Policy</h1>
          <p className="text-secondary">Last updated: May 7, 2026</p>
        </div>

        <div className="prose prose-lg max-w-none text-secondary">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-dark mb-4">Information We Collect</h2>
            <p className="mb-4">
              We collect information you provide directly to us, such as when you create an account,
              contribute to a wedding registry, or contact us for support.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (name, email, password)</li>
              <li>Wedding registry details</li>
              <li>Contribution information and payment details</li>
              <li>Communication preferences</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-dark mb-4">How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain our services</li>
              <li>Process payments and contributions</li>
              <li>Send you important updates and receipts</li>
              <li>Improve our platform and customer experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-dark mb-4">Information Sharing</h2>
            <p className="mb-4">
              We do not sell, trade, or otherwise transfer your personal information to third parties
              without your consent, except as described in this policy.
            </p>
            <p>
              We may share information with service providers who assist us in operating our platform,
              processing payments, or providing customer support.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-dark mb-4">Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information against
              unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-dark mb-4">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at
              <a href="mailto:support@zealpha.com" className="text-primary hover:text-primary-dark ml-1">
                support@zealpha.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;