import { Link } from "react-router-dom";
import "./Pages.css";

const stats = [
  { number: "12,000+", label: "Active Readers", icon: "👥" },
  { number: "2,500+", label: "Digital Books", icon: "📚" },
  { number: "450+", label: "Authors", icon: "✍️" },
  { number: "50+", label: "Categories", icon: "🗂️" }
];

const features = [
  {
    icon: "🔍",
    title: "Smart Discovery",
    description: "Advanced search and recommendation algorithms help you find your next favorite book."
  },
  {
    icon: "📱",
    title: "Multi-Device Reading",
    description: "Seamless reading experience across all your devices with cloud synchronization."
  },
  {
    icon: "💾",
    title: "Personal Library",
    description: "Build your digital library, create reading lists, and track your progress."
  },
  {
    icon: "✍️",
    title: "Author Tools",
    description: "Comprehensive publishing platform for authors to share their work with readers."
  },
  {
    icon: "🌐",
    title: "Community Features",
    description: "Connect with fellow readers, share reviews, and discover new recommendations."
  },
  {
    icon: "🔒",
    title: "Privacy First",
    description: "Your reading data and personal information are always secure and private."
  }
];

const values = [
  {
    title: "Cultural Preservation",
    description: "We're committed to preserving and promoting Nepal's rich literary heritage for future generations.",
    icon: "🏛️"
  },
  {
    title: "Accessibility",
    description: "Making Nepali literature accessible to everyone, everywhere, regardless of location or background.",
    icon: "🌍"
  },
  {
    title: "Quality Content",
    description: "Curating only the finest literary works and maintaining high standards across our collection.",
    icon: "⭐"
  },
  {
    title: "Author Support",
    description: "Empowering authors with tools and platforms to reach their audience and build their careers.",
    icon: "🚀"
  }
];

const team = [
  {
    name: "Rajesh Sharma",
    role: "Founder & CEO",
    description: "Passionate advocate for Nepali literature with 15+ years in digital publishing.",
    avatar: "RS"
  },
  {
    name: "Sita Poudel",
    role: "Head of Content",
    description: "Literary scholar and curator ensuring quality across our book collection.",
    avatar: "SP"
  },
  {
    name: "Arjun Thapa",
    role: "Lead Developer",
    description: "Technology expert building the future of digital reading experiences.",
    avatar: "AT"
  }
];

export default function About() {
  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-background">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
          <div className="hero-shape hero-shape-3"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🏛️</span>
            About Pustakyatra
          </div>
          <h1 className="hero-title">
            Nepal's Premier <span className="title-highlight">Digital Library</span>
          </h1>
          <p className="hero-subtitle">
            We're building the future of Nepali literature by connecting readers with stories, 
            authors with audiences, and preserving our cultural heritage in the digital age.
          </p>
          
          <div className="hero-actions">
            <Link to="/register" className="btn-primary">
              Join Our Community
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </Link>
            <Link to="/browse" className="btn-outline">
              Explore Books
            </Link>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <span className="stat-icon">{stat.icon}</span>
                <span className="stat-number">{stat.number}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="content-section">
        <div className="mission-vision">
          <div className="mission-card">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h2 className="card-title">Our Mission</h2>
            <p className="card-description">
              To preserve, promote, and make Nepali literature accessible to readers worldwide. 
              We believe every story deserves to be heard and every reader deserves access to 
              quality content in their native language.
            </p>
            <div className="card-highlight">
              "Literature is the mirror of society, and we're here to keep that mirror clear and accessible."
            </div>
          </div>

          <div className="vision-card">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h2 className="card-title">Our Vision</h2>
            <p className="card-description">
              To become the leading digital platform for Nepali literature, fostering a vibrant 
              community where authors and readers connect, stories flourish, and cultural heritage 
              thrives in the digital age.
            </p>
            <div className="card-highlight">
              "Building bridges between traditional storytelling and modern technology."
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">What We Offer</h2>
          <p className="section-subtitle">Comprehensive tools and features for the modern reader</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">Our Values</h2>
          <p className="section-subtitle">The principles that guide everything we do</p>
        </div>

        <div className="values-grid">
          {values.map((value, index) => (
            <div key={index} className="value-card">
              <div className="value-icon">{value.icon}</div>
              <div className="value-content">
                <h3 className="value-title">{value.title}</h3>
                <p className="value-description">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">Meet Our Team</h2>
          <p className="section-subtitle">The passionate people behind Pustakyatra</p>
        </div>

        <div className="team-grid">
          {team.map((member, index) => (
            <div key={index} className="team-card">
              <div className="team-avatar">
                <span className="avatar-text">{member.avatar}</span>
              </div>
              <h3 className="team-name">{member.name}</h3>
              <p className="team-role">{member.role}</p>
              <p className="team-description">{member.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="content-section">
        <div className="cta-section">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Start Your Literary Journey?</h2>
            <p className="cta-description">
              Join thousands of readers and authors who have made Pustakyatra their home for 
              Nepali literature. Whether you're here to read or publish, we welcome you to our community.
            </p>
            <div className="cta-stats">
              <div className="cta-stat">
                <span className="cta-stat-number">4.8/5</span>
                <span className="cta-stat-label">User Rating</span>
              </div>
              <div className="cta-stat">
                <span className="cta-stat-number">99.9%</span>
                <span className="cta-stat-label">Uptime</span>
              </div>
              <div className="cta-stat">
                <span className="cta-stat-number">24/7</span>
                <span className="cta-stat-label">Support</span>
              </div>
            </div>
            <div className="cta-actions">
              <Link to="/register" className="btn-primary">
                Create Account
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </Link>
              <Link to="/browse" className="btn-outline">
                Browse Books
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}