import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';

type ModalType = 'terms' | 'privacy';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  type: ModalType;
  onClose: () => void;
}

interface LegalSection {
  heading: string;
  body: string[];
  emphasize?: boolean;
}

interface LegalDoc {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

const LEGAL_META = {
  websiteName: 'Ermel Glass & Aluminum Works Website',
  businessName: 'Ermel Glass and Aluminum Works',
  email: 'info@ermelglass.com',
  phone: '+63 938 602 0346',
  address: '1528 Nicolas Zamora St., Tondo, City of Manila, 1012 Metro Manila, Philippines',
};

function applyPlaceholders(text: string): string {
  return text
    .replace(/\[WEBSITE NAME\]/g, LEGAL_META.websiteName)
    .replace(/\[BUSINESS NAME\]/g, LEGAL_META.businessName)
    .replace(/\[EMAIL\]/g, LEGAL_META.email)
    .replace(/\[PHONE\]/g, LEGAL_META.phone)
    .replace(/\[ADDRESS\]/g, LEGAL_META.address);
}

const TERMS_DOC: LegalDoc = {
  title: 'Terms and Conditions',
  lastUpdated: 'March 20, 2026',
  sections: [
    {
      heading: '1. Acceptance of Terms',
      body: [
        'By creating an account, requesting a quotation, or using [WEBSITE NAME], you agree to be bound by these Terms and Conditions and all applicable laws.',
        'If you do not agree with any part of these Terms, you must not use this platform.',
      ],
      emphasize: true,
    },
    {
      heading: '2. Services',
      body: [
        '[BUSINESS NAME] provides glass and aluminum quotation, reservation scheduling, and project-tracking features for residential and commercial clients.',
        'All quotations are estimates and may be adjusted based on site conditions, final measurements, materials, and approved scope.',
      ],
    },
    {
      heading: '3. Account Responsibilities',
      body: [
        'You are responsible for maintaining the confidentiality of your login credentials and for activities made under your account.',
        'You agree to provide accurate, current, and complete information during signup and quotation requests.',
      ],
    },
    {
      heading: '4. Quotations, Approvals, and Reservations',
      body: [
        'Quotation statuses and updates are provided within the system and may include revised pricing or remarks from authorized staff.',
        'Reservation schedules are subject to availability and business rules, including date validation windows and blocked dates.',
        'Project timelines may change due to weather, material availability, permits, and force majeure events.',
      ],
    },
    {
      heading: '5. Acceptable Use',
      body: [
        'You agree not to misuse the platform, attempt unauthorized access, submit false information, or interfere with service availability.',
        'Any abusive, fraudulent, or malicious activity may result in account suspension and legal action.',
      ],
      emphasize: true,
    },
    {
      heading: '6. Intellectual Property',
      body: [
        'All platform content, branding, and materials are owned by [BUSINESS NAME] or licensed to it, unless otherwise stated.',
        'You may not copy, distribute, or reuse protected content without prior written permission.',
      ],
    },
    {
      heading: '7. Limitation of Liability',
      body: [
        '[BUSINESS NAME] is not liable for indirect, incidental, or consequential damages arising from platform use, service interruptions, or third-party failures.',
        'To the extent permitted by law, total liability shall not exceed the value of services directly paid for by the affected customer.',
      ],
    },
    {
      heading: '8. Governing Law',
      body: [
        'These Terms are governed by the laws of the Republic of the Philippines.',
        'Any disputes shall be resolved in the proper courts of Manila, unless otherwise required by law.',
      ],
    },
    {
      heading: '9. Contact',
      body: [
        'For concerns about these Terms, contact us at [EMAIL], [PHONE], or visit us at [ADDRESS].',
      ],
    },
  ],
};

const PRIVACY_DOC: LegalDoc = {
  title: 'Privacy Policy',
  lastUpdated: 'March 20, 2026',
  sections: [
    {
      heading: '1. Overview',
      body: [
        '[BUSINESS NAME] respects your privacy and is committed to protecting your personal information when you use [WEBSITE NAME].',
        'This Policy explains how we collect, use, store, and safeguard your data.',
      ],
      emphasize: true,
    },
    {
      heading: '2. Information We Collect',
      body: [
        'We collect account data such as full name, email, encrypted password, and consent flags for Terms and Privacy.',
        'We collect quotation and reservation details including measurements, contact information, project type, and scheduling preferences.',
        'We may collect technical logs such as request timestamps and security events for operational monitoring and abuse prevention.',
      ],
    },
    {
      heading: '3. How We Use Information',
      body: [
        'To create and maintain your account and session authentication.',
        'To process quotations, reservations, status updates, and notifications.',
        'To improve service quality, security, analytics, and customer support response times.',
      ],
    },
    {
      heading: '4. Legal Basis and Consent',
      body: [
        'By checking the Terms and Privacy checkboxes during registration, you consent to data processing necessary for account and service delivery.',
        'You may contact us to request access, correction, or deletion of your personal data, subject to legal and operational retention requirements.',
      ],
      emphasize: true,
    },
    {
      heading: '5. Data Sharing',
      body: [
        'We do not sell your personal information.',
        'Data may be shared only with authorized internal staff and trusted service providers strictly for business operations (e.g., email delivery, database hosting).',
      ],
    },
    {
      heading: '6. Data Security',
      body: [
        'We implement access controls, encrypted password storage, session security, and audit logging to protect your data.',
        'While we apply reasonable safeguards, no platform is completely immune to security risks.',
      ],
    },
    {
      heading: '7. Retention',
      body: [
        'We retain personal data only as long as necessary for service delivery, legal compliance, dispute resolution, and legitimate business purposes.',
      ],
    },
    {
      heading: '8. Cookies and Sessions',
      body: [
        'We use secure session cookies to keep users authenticated while using the platform.',
        'These cookies are essential for account login, authorization checks, and protected actions.',
      ],
    },
    {
      heading: '9. Contact',
      body: [
        'For privacy requests or concerns, contact [EMAIL], call [PHONE], or write to [ADDRESS].',
      ],
    },
  ],
};

export default function TermsPrivacyModal({ isOpen, type, onClose }: TermsPrivacyModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const doc = useMemo(() => (type === 'terms' ? TERMS_DOC : PRIVACY_DOC), [type]);

  useEffect(() => {
    if (!isOpen) return;

    setHasReachedEnd(false);
    const scrollEl = contentRef.current;
    if (scrollEl) {
      scrollEl.scrollTop = 0;
    }

    setIsVisible(false);
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen, type]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 12;
    if (atBottom) setHasReachedEnd(true);
  };

  if (!isOpen) return null;

  return (
    <div className={`legal-modal-overlay ${isVisible ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label={doc.title}>
      <div className={`legal-modal-shell ${isVisible ? 'open' : ''}`}>
        <div className="legal-modal-header">
          <div>
            <h2 className="legal-modal-title">{doc.title}</h2>
            <p className="legal-modal-updated">Last Updated: {doc.lastUpdated}</p>
          </div>
          <button type="button" className="legal-modal-close" aria-label="Close modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="legal-modal-body" ref={contentRef} onScroll={handleScroll}>
          {doc.sections.map((section, index) => (
            <section
              key={`${section.heading}-${index}`}
              className={`legal-section ${section.emphasize ? 'emphasize' : ''}`}
            >
              <h3>{section.heading}</h3>
              {section.body.map((paragraph, pIndex) => (
                <p key={`${section.heading}-p-${pIndex}`}>{applyPlaceholders(paragraph)}</p>
              ))}
            </section>
          ))}
        </div>

        <div className="legal-modal-footer">
          <span className={`legal-scroll-indicator ${hasReachedEnd ? 'done' : ''}`}>
            {hasReachedEnd ? 'You have reached the end of this document.' : 'Scroll to the end to review all sections.'}
          </span>
        </div>
      </div>
    </div>
  );
}
