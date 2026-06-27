import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api.js';

const Support = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/support', formData);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-[2rem] p-8 shadow-premium">
        <div className="mb-8">
          <Link to="/" className="text-primary hover:text-primary-dark mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-serif font-bold text-primary-dark mb-4">Support Center</h1>
          <p className="text-secondary">We're here to help you with your ZeAlpha experience</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-semibold text-primary-dark mb-6">Get in Touch</h2>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-green-800 font-semibold mb-2">Thank you for contacting us!</h3>
                <p className="text-green-700">
                  We've received your message and will get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:bg-gray-300"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-primary-dark mb-6">Frequently Asked Questions</h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-primary-dark mb-2">How do I create a wedding registry?</h3>
                <p className="text-secondary text-sm">
                  Sign up as a couple, complete your profile, and use our setup wizard to create your registry.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary-dark mb-2">What payment methods do you accept?</h3>
                <p className="text-secondary text-sm">
                  We accept Stripe payments and bank transfers for manual verification.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary-dark mb-2">How do refunds work?</h3>
                <p className="text-secondary text-sm">
                  Refunds are processed according to our refund policy. Contact support for assistance.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary-dark mb-2">Is my information secure?</h3>
                <p className="text-secondary text-sm">
                  Yes, we use industry-standard encryption and security measures to protect your data.
                </p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-ivory rounded-lg">
              <h3 className="font-semibold text-primary-dark mb-2">Need immediate help?</h3>
              <p className="text-secondary text-sm mb-4">
                For urgent issues, you can also reach us at:
              </p>
              <p className="text-primary font-medium">support@zealpha.com</p>
              <p className="text-secondary text-sm">Response time: Within 24 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;