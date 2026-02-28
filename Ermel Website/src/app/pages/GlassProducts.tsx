export default function GlassProducts() {
  const glassTypes = [
    { name: 'Tempered Glass-Clear', desc: 'Heat-treated safety glass that shatters into small granular pieces when broken.' },
    { name: 'Tinted', desc: 'Glass with color additives that reduce glare and solar heat gain.' },
    { name: 'Laminated', desc: 'Two or more layers of glass bonded with an interlayer for safety and security.' },
    { name: 'Clear Float Glass', desc: 'Standard flat glass with high transparency and smooth surface.' },
    { name: 'Tinted Glass', desc: 'Available in various colors to reduce heat and enhance aesthetics.' },
    { name: 'Heat-Resistant Tempered Glass', desc: 'Specially treated to withstand high temperatures without breaking.' },
    { name: 'Sand Blasted', desc: 'Frosted finish created by abrasive blasting for privacy and design.' },
    { name: 'Frosted Glass', desc: 'Translucent glass that obscures visibility while allowing light transmission.' },
  ];

  const tintedColors = [
    { name: 'Clear', color: '#f0f0f0' },
    { name: 'Euro Gray', color: '#6b7a8c' },
    { name: 'Dark Gray', color: '#4a5460' },
    { name: 'Bronze', color: '#8b6f47' },
    { name: 'Dark Bronze', color: '#6e5433' },
    { name: 'Green', color: '#7ba89d' },
  ];

  const reflectiveColors = [
    { name: 'Clear', color: '#e8e8e8' },
    { name: 'Dark Gray', color: '#555f6a' },
    { name: 'Silver', color: '#a8b5c0' },
    { name: 'Blue', color: '#6a9db8' },
    { name: 'Green', color: '#7a9e8a' },
    { name: 'Gold', color: '#c9a961' },
    { name: 'Dark Blue', color: '#4a6d8a' },
    { name: 'Bronze', color: '#8b7355' },
  ];

  const applications = [
    { name: 'Frameless Storefront', desc: 'Sleek modern entry solutions using large glass panels with minimal framing for maximum visibility.' },
    { name: 'Frameless Glass Partitions', desc: 'Open-plan office dividers maintaining transparency and natural light flow throughout the workspace.' },
    { name: 'Frameless Curtainwall', desc: 'Exterior building skin creating seamless glass facades for contemporary architectural designs.' },
    { name: 'Frameless Shower Enclosure', desc: 'Luxurious bathroom features with clean lines that expand the visual space of any bathroom.' },
    { name: 'Frameless Swing Glass Door', desc: 'Sophisticated entrance or interior door with minimal hardware showcasing unobstructed views.' },
    { name: 'Frameless Sliding Door', desc: 'Space-saving solution with smooth operation ideal for balconies and patio access.' },
    { name: 'Frameless Glass Sliding Window', desc: 'Modern window system offering unobstructed views with sleek sliding mechanism.' },
    { name: 'Decorative Mirrors', desc: 'Custom mirrors enhancing interior spaces with style while creating illusion of depth.' },
  ];

  return (
    <div style={{ backgroundColor: '#fafafa', fontFamily: 'var(--font-body)', minHeight: '100vh', paddingTop: '76px' }}>
      {/* Hero Section */}
      <section
        className="relative py-20 px-6"
        style={{
          background: 'linear-gradient(135deg, #15263c 0%, #1e3655 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <div
            style={{
              color: '#ff8888',
              fontFamily: 'var(--font-heading)',
              fontSize: '14px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            PREMIUM QUALITY
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'white',
              fontSize: 'clamp(32px, 6vw, 56px)',
              fontWeight: 800,
              lineHeight: 1.1,
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            Transform Your Space with<br />
            Premium Glass Architectural Glazing
          </h1>
          <p style={{ color: '#9ab0c4', fontSize: '17px', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
            Our glass products combine aesthetics with functionality, offering various types, colors, and applications to meet your specific needs.
          </p>
        </div>
      </section>

      {/* Glass Product Details */}
      <section className="py-16 px-6" style={{ backgroundColor: 'white' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
              Glass Product Details
            </h2>
            <p style={{ color: '#54667d', fontSize: '15px', maxWidth: '800px', margin: '0 auto', lineHeight: 1.7 }}>
              Our glass products are sourced from leading manufacturers and meet all Philippine safety standards. We ensure strict quality control from procurement through installation, guaranteeing durable and safe glazing for your project.
            </p>
          </div>
        </div>
      </section>

      {/* Glass Types */}
      <section className="py-16 px-6" style={{ backgroundColor: '#f0f2f5' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
              Glass Types
            </h2>
            <p style={{ color: '#54667d', fontSize: '15px', maxWidth: '700px', margin: '0 auto 24px', lineHeight: 1.7 }}>
              We offer a variety of glass types, each tailored for specific needs. From basic clear glass to specialty items like tinted, laminated, and heat-resistant tempered glass, all designed to meet project requirements and safety standards.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {glassTypes.map((type) => (
              <div
                key={type.name}
                className="p-5 rounded-lg"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '16px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>
                  {type.name}
                </h3>
                <p style={{ color: '#54667d', fontSize: '13px', lineHeight: 1.6 }}>
                  {type.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Glass Colors */}
      <section className="py-16 px-6" style={{ backgroundColor: 'white' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
              Glass Colors
            </h2>
            <p style={{ color: '#54667d', fontSize: '15px', maxWidth: '700px', margin: '0 auto', lineHeight: 1.7 }}>
              Glass is available in a variety of colors and shades. From subtle tinted options to bold reflective finishes, our color selection allows for versatility in design while maintaining structural integrity and thermal performance.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            {/* Tinted Colors */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '20px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase' }}>
                Tinted Glass Colors
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {tintedColors.map((c) => (
                  <div key={c.name} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f0f2f5' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: c.color, borderRadius: '6px', border: '1px solid #d9d9d9' }} />
                    <span style={{ fontFamily: 'var(--font-body)', color: '#15263c', fontSize: '14px', fontWeight: 600 }}>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Reflective Colors */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '20px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase' }}>
                Reflective Glass Colors
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {reflectiveColors.map((c) => (
                  <div key={c.name} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f0f2f5' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: c.color, borderRadius: '6px', border: '1px solid #d9d9d9' }} />
                    <span style={{ fontFamily: 'var(--font-body)', color: '#15263c', fontSize: '14px', fontWeight: 600 }}>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Glass Applications */}
      <section className="py-16 px-6" style={{ backgroundColor: '#f0f2f5' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
              Glass Applications
            </h2>
            <p style={{ color: '#54667d', fontSize: '15px', maxWidth: '700px', margin: '0 auto', lineHeight: 1.7 }}>
              Our glass products are suitable for a wide range of applications, from commercial storefronts to residential shower enclosures.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {applications.map((app) => (
              <div
                key={app.name}
                className="p-5 rounded-lg"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: '15px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>
                  {app.name}
                </h3>
                <p style={{ color: '#54667d', fontSize: '13px', lineHeight: 1.6 }}>
                  {app.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
