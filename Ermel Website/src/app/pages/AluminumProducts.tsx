export default function AluminumProducts() {
  const standardColors = [
    { name: 'Anodized Cashmere Black', color: '#2a2a2a' },
    { name: 'Anodized Cashmere Silver', color: '#b8b8b8' },
    { name: 'Anodized Black', color: '#1a1a1a' },
    { name: 'Charcoal', color: '#3d3d3d' },
  ];

  const powderCoatedColors = [
    { name: 'Bronze', color: '#7a5f3f' },
    { name: 'Copper', color: '#a66b4f' },
    { name: 'Champagne', color: '#b8956f' },
    { name: 'Brown', color: '#5c4a3a' },
    { name: 'Wood Grain', color: '#8b6f47' },
  ];

  const applications = [
    { name: 'Framed Storefront', desc: 'Robust building aluminum frames with glass inserts for commercial establishments offering security and aesthetic appeal.' },
    { name: 'Framed Glass Partitions', desc: 'Interior dividing aluminum frames with glass panels for modern offices, creating defined spaces while maintaining openness.' },
    { name: 'Framed Curtainwall', desc: 'Exterior building aluminum facade with glass panels, transforming building exteriors with a sleek and professional look that improves energy efficiency.' },
    { name: 'Framed Shower Enclosure', desc: 'Water-tight aluminum frames with glass panels for bathrooms, providing a durable and stylish solution to contain moisture effectively.' },
    { name: 'Framed Swing Glass Door', desc: 'Pivot-action aluminum frames combined with glass panels with premium hinges and locks, elegant and sturdy for high-traffic areas.' },
    { name: 'Framed Glass Sliding Door', desc: 'Your standard aluminum sliding door using quality rollers, accessories, and hardware that ensures smooth and silent operation.' },
    { name: 'Framed Glass Sliding Window', desc: 'Your standard aluminum sliding window, offering quality rollers, accessories, and durable hardware for both ventilation and aesthetics.' },
    { name: 'Aluminum Composite Panel (ACP) Cladding', desc: 'ACP or Aluminum Composite Panel is a lightweight and durable cladding option ideal for facades. Provides aesthetic value as a layering option with a building facade, interior use, or as signage. Available in a large variety of colors, other uses are for interior fit-outs, store remodels or as material trim that provides a degree of thermal insulation.' },
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
            DURABLE & SLEEK
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
            Upgrade to Sleek and Durable<br />
            Aluminum Frames, Doors, and Windows
          </h1>
          <p style={{ color: '#9ab0c4', fontSize: '17px', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
            Engineered for durability, our aluminum products are impervious to corrosion and can withstand harsh weather conditions, ensuring long-lasting performance.
          </p>
        </div>
      </section>

      {/* Aluminum Details */}
      <section className="py-16 px-6" style={{ backgroundColor: 'white' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
              Aluminum
            </h2>
            <p style={{ color: '#54667d', fontSize: '15px', maxWidth: '800px', margin: '0 auto', lineHeight: 1.7 }}>
              Engineered for durability, our aluminum products are impervious to corrosion and can withstand harsh weather conditions, ensuring long-lasting performance. These sleek and minimalist design of aluminum frames can be coated to almost any color showcases the aesthetic appeal of any space.
            </p>
          </div>
        </div>
      </section>

      {/* Standard Colors */}
      <section className="py-16 px-6" style={{ backgroundColor: '#f0f2f5' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
              Standard Colors
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {standardColors.map((c) => (
              <div
                key={c.name}
                className="p-5 rounded-lg"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ width: '50px', height: '50px', backgroundColor: c.color, borderRadius: '6px', border: '1px solid #d9d9d9', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Powder Coated Colors */}
      <section className="py-16 px-6" style={{ backgroundColor: 'white' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
              Special Powder Coated Colors
            </h2>
            <p style={{ color: '#54667d', fontSize: '15px', maxWidth: '700px', margin: '0 auto', lineHeight: 1.7 }}>
              Special Powder Coated Colors are available for approval depending on quantity of your requirements. Additional charges will be applied.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {powderCoatedColors.map((c) => (
              <div
                key={c.name}
                className="p-5 rounded-lg"
                style={{
                  backgroundColor: '#f0f2f5',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ width: '100%', height: '80px', backgroundColor: c.color, borderRadius: '6px', border: '1px solid #d9d9d9' }} />
                <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Aluminum Applications */}
      <section className="py-16 px-6" style={{ backgroundColor: '#f0f2f5' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
              Aluminum Applications
            </h2>
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
