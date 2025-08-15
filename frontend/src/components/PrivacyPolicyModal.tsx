import React, { useEffect } from 'react';
// import { X } from 'lucide-react';
//make it typescript
type PrivacyPolicyModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const PrivacyPolicyModal = ({ isOpen, onClose }: PrivacyPolicyModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close modal when clicking outside
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full relative overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Privacy Policy</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-black"
            aria-label="Close modal"
          >
            {/* <X className="w-6 h-6 text-gray-600" /> */}
            X
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="prose max-w-none text-gray-700">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Update Ink Privacy Policy</h3>
              <p className="text-sm text-gray-600 mb-4"><strong>Last Updated: August 8, 2025</strong></p>
              <p className="mb-4">
                Update Ink (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you visit our website, sign up for our newsletter, or interact with our content.
              </p>
              <p className="mb-6">
                By using our services, you agree to the terms in this Privacy Policy.
              </p>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">1. Information We Collect</h4>
              <p className="mb-3">We may collect the following types of information:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Personal Information:</strong> Your name, email address, phone number, and any other details you provide when subscribing or contacting us.</li>
                <li><strong>Technical Information:</strong> Your IP address, browser type, device type, and information collected through cookies or similar technologies.</li>
                <li><strong>Usage Information:</strong> Pages you visit, links you click, and how you interact with our emails or website.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">2. How We Collect Information</h4>
              <p className="mb-3">We collect information when you:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Sign up for our newsletter.</li>
                <li>Contact us through forms, email, or phone.</li>
                <li>Interact with our website or email campaigns (including via cookies and tracking pixels).</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">3. How We Use Your Information</h4>
              <p className="mb-3">We use your information to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Send you our newsletter and updates.</li>
                <li>Provide local event and business information.</li>
                <li>Improve our website, emails, and marketing.</li>
                <li>Respond to your questions or requests.</li>
                <li>Show you relevant offers or advertisements.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">4. How We Share Your Information</h4>
              <p className="mb-3">We do not sell your personal information. We may share information with:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Service Providers:</strong> Email platforms, website hosting providers, and analytics tools that help us operate our business.</li>
                <li><strong>Legal Requirements:</strong> If required by law, court order, or to prevent fraud or security issues.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">5. Cookies & Tracking Technologies</h4>
              <p className="mb-4">
                We use cookies and similar technologies to improve your experience, analyze traffic, and deliver relevant content. You can adjust your browser settings to refuse cookies, but some features may not function properly.
              </p>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">6. How We Protect Your Information</h4>
              <p className="mb-4">
                We use security measures such as encryption, password protection, and secure servers to protect your information. While we take precautions, no method of storage or transmission is completely secure.
              </p>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">7. Data Retention</h4>
              <p className="mb-4">
                We keep your personal information only as long as necessary to fulfill the purposes described in this policy or as required by law.
              </p>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">8. Your Privacy Rights</h4>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Access, correct, or request deletion of your personal information (where applicable by law).</li>
                <li>Opt out of marketing emails at any time by clicking the &quot;unsubscribe&quot; link or contacting us directly.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">9. Third-Party Links</h4>
              <p className="mb-4">
                Our website or emails may contain links to other websites. We are not responsible for the privacy practices of those third parties.
              </p>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">10. Changes to This Privacy Policy</h4>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. If significant changes are made, we will notify you by email or by posting a notice on our website.
              </p>
            </div>

            <div className="mb-4">
              <p>
                If you have questions about our privacy policy please reply to one of our emails with any concerns. We always strive for maximum privacy for your personal data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;