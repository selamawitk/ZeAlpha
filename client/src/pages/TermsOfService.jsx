import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-ivory py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-[2rem] p-8 shadow-premium">
        <div className="mb-8">
          <Link to="/" className="text-primary hover:text-primary-dark mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-serif font-bold text-primary-dark mb-4">Terms of Service</h1>
          <p className="text-secondary">Last updated: May 7, 2026</p>
        </div>

        <div className="prose prose-lg max-w-none text-secondary">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-dark mb-4">Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using ZeAlpha, you accept and agree to be bound by the terms
              and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-dark mb-4">Use License</h2>
            <p className="mb-4">
              Permission is granted to temporarily access the materials (information or software)
              on ZeAlpha's website for personal, non-commercial transitory viewing only.
            </p>
            <p>This license shall automatically terminate if you violate any of these restrictions.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-dark mb-4">User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Use the platform in accordance with applicable laws</li>
              <li>Respect the privacy and rights of other users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-dark mb-4">Payment Terms</h2>
            <p className="mb-4">
              All payments are processed securely through our payment partners. Refunds are
              handled according to our refund policy and applicable payment processor terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-dark mb-4">Limitation of Liability</h2>
            <p>
              In no event shall ZeAlpha or its suppliers be liable for any damages
              (including, without limitation, damages for loss of data or profit, or due to
              business interruption) arising out of the use or inability to use the materials
              on ZeAlpha's website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-dark mb-4">Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at
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

export default TermsOfService;