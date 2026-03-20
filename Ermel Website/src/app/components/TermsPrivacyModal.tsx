import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';

export type LegalModalType = 'terms' | 'privacy';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  type: LegalModalType;
  onClose: () => void;
}

interface LegalSection {
  heading: string;
  paragraphs: string[];
  highlight?: boolean;
}

const PLACEHOLDERS = {
  '[WEBSITE NAME]': 'Ermel Glass and Aluminum Works Website',
  '[BUSINESS NAME]': 'Ermel Glass and Aluminum Works',
  '[EMAIL]': 'info@ermelglass.com',
  '[PHONE]': '+63 938 602 0346',
  '[ADDRESS]': '1528 Nicolas Zamora St., Tondo, City of Manila, 1012 Metro Manila, Philippines',
} as const;

const LAST_UPDATED = 'March 20, 2026';

const LEGAL_CONTENT: Record<LegalModalType, { title: string; sections: LegalSection[] }> = {
  terms: {
    title: 'Terms and Conditions',
    sections: [
      {
        heading: '1. Agreement to Terms',
        paragraphs: [
          'By accessing and using [WEBSITE NAME], you agree to be bound by these Terms and Conditions and all applicable laws and regulations. If you do not agree with any part of these terms, you must not use this website.',
          '[WEBSITE NAME] is owned and operated by [BUSINESS NAME].',
        ],
      },
      {
        heading: '2. Services and Quotations',
        paragraphs: [
          '[BUSINESS NAME] provides information, quotation support, and project-related services for glass and aluminum works. Any quotation generated through the platform is subject to validation, site conditions, availability of materials, and final business approval.',
          'Submission of a request does not automatically create a binding service contract until confirmed by [BUSINESS NAME].',
        ],
      },
      {
        heading: '3. User Responsibilities',
        paragraphs: [
          'You agree to provide accurate and complete account information, including your full name, email address, and any project details required for quotations.',
          'You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account.',
        ],
        highlight: true,
      },
      {
        heading: '4. Acceptable Use',
        paragraphs: [
          'You must not use [WEBSITE NAME] for fraudulent, abusive, unlawful, or harmful activities. You must not attempt to access systems, accounts, or data that are not intended for your access.',
          '[BUSINESS NAME] reserves the right to suspend or terminate accounts that violate these Terms and Conditions.',
        ],
      },
      {
        heading: '5. Pricing, Changes, and Availability',
        paragraphs: [
          'Prices, materials, project timelines, and service availability may change without prior notice due to market fluctuations, supplier availability, and operational requirements.',
          '[BUSINESS NAME] is not liable for delays caused by force majeure, weather conditions, or third-party logistics beyond reasonable control.',
        ],
      },
      {
        heading: '6. Intellectual Property',
        paragraphs: [
          'All website content, branding, design assets, and service materials are owned by [BUSINESS NAME] or used with proper authorization. You may not copy, reproduce, distribute, or commercially exploit any content without prior written consent.',
        ],
      },
      {
        heading: '7. Limitation of Liability',
        paragraphs: [
          'To the maximum extent permitted by law, [BUSINESS NAME] is not liable for indirect, incidental, or consequential damages arising from use of [WEBSITE NAME], including data loss, interruption, or service delays.',
        ],
        highlight: true,
      },
      {
        heading: '8. Governing Law',
        paragraphs: [
          'These Terms and Conditions are governed by the laws of the Republic of the Philippines. Any dispute shall be handled in the appropriate courts of Metro Manila, unless otherwise required by law.',
        ],
      },
      {
        heading: '9. Contact Information',
        paragraphs: [
          'For questions regarding these Terms and Conditions, contact [BUSINESS NAME] at [EMAIL], [PHONE], or visit us at [ADDRESS].',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        heading: '1. Scope of this Policy',
        paragraphs: [
          'This Privacy Policy explains how [BUSINESS NAME] collects, uses, stores, and protects personal information submitted through [WEBSITE NAME].',
        ],
      },
      {
        heading: '2. Information We Collect',
        paragraphs: [
          'We may collect your full name, email address, phone number, address, account credentials, and project details when you create an account, request a quote, or communicate with us.',
          'We may also collect technical data such as browser type, device information, and interaction logs to maintain service performance and security.',
        ],
      },
      {
        heading: '3. How We Use Your Information',
        paragraphs: [
          'Your information is used to process quote requests, manage project communications, verify your account, improve customer support, and maintain secure access to your account.',
          'We do not sell your personal information to third parties.',
        ],
        highlight: true,
      },
      {
        heading: '4. Legal Basis and Consent',
        paragraphs: [
          'By registering on [WEBSITE NAME], you acknowledge and consent to this Privacy Policy and to the processing of your information for legitimate business purposes related to [BUSINESS NAME] operations.',
        ],
      },
      {
        heading: '5. Data Sharing and Third Parties',
        paragraphs: [
          'We may share limited data with service providers that support website hosting, analytics, database services, and communications, only to the extent needed for service delivery and security.',
          'Any third-party processing is handled under appropriate confidentiality and data protection obligations.',
        ],
      },
      {
        heading: '6. Data Retention',
        paragraphs: [
          'We retain personal data only as long as required for account management, legal compliance, service fulfillment, and dispute resolution, or as required by applicable law.',
        ],
      },
      {
        heading: '7. Security Measures',
        paragraphs: [
          '[BUSINESS NAME] uses reasonable administrative, technical, and organizational safeguards to protect personal data against unauthorized access, disclosure, alteration, or destruction.',
        ],
        highlight: true,
      },
      {
        heading: '8. Your Rights',
        paragraphs: [
          'Subject to applicable Philippine data protection laws, you may request access, correction, or deletion of your personal data, and may contact us for privacy-related concerns.',
        ],
      },
      {
        heading: '9. Policy Updates and Contact',
        paragraphs: [
          'We may update this Privacy Policy from time to time. Material changes will be reflected with a new Last Updated date. For privacy requests, contact [BUSINESS NAME] at [EMAIL], call [PHONE], or visit [ADDRESS].',
        ],
      },
    ],
  },
};

function replacePlaceholders(content: string): string {
  return Object.entries(PLACEHOLDERS).reduce(
    (output, [token, value]) => output.replaceAll(token, value),
    content,
  );
}

export default function TermsPrivacyModal({ isOpen, type, onClose }: TermsPrivacyModalProps) {
  const [didReachBottom, setDidReachBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const modalData = useMemo(() => {
    const source = LEGAL_CONTENT[type];
    return {
      title: source.title,
      sections: source.sections.map((section) => ({
        ...section,
        paragraphs: section.paragraphs.map((p) => replacePlaceholders(p)),
      })),
    };
  }, [type]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setDidReachBottom(false);
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen, type]);

  const handleScroll = () => {
    const content = contentRef.current;
    if (!content) return;

    const isAtBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 16;
    if (isAtBottom) {
      setDidReachBottom(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="legal-modal-overlay" role="dialog" aria-modal="true" aria-label={modalData.title}>
      <div className="legal-modal-container">
        <div className="legal-modal-header">
          <div>
            <h2 className="legal-modal-title">{modalData.title}</h2>
            <p className="legal-modal-updated">Last Updated: {LAST_UPDATED}</p>
          </div>
          <button
            type="button"
            className="legal-modal-close"
            onClick={onClose}
            aria-label={`Close ${modalData.title}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="legal-modal-content" ref={contentRef} onScroll={handleScroll}>
          {modalData.sections.map((section, index) => (
            <section
              key={section.heading}
              className={`legal-section${section.highlight ? ' is-highlight' : ''}`}
            >
              <h3>{section.heading}</h3>
              {section.paragraphs.map((paragraph) => (
                <p key={`${section.heading}-${paragraph.slice(0, 20)}`}>{paragraph}</p>
              ))}
              {index < modalData.sections.length - 1 && <div className="legal-section-divider" aria-hidden="true" />}
            </section>
          ))}
        </div>

        <div className="legal-modal-footer">
          {didReachBottom ? (
            <span className="legal-scroll-status done">You reached the end of this document.</span>
          ) : (
            <span className="legal-scroll-status">Scroll to review the full document.</span>
          )}
        </div>
      </div>
    </div>
  );
}
